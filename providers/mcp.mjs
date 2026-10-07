#!/usr/bin/env node
// MCP server "sami-media" (stdio) for Claude Code: stock search, cost estimates, generation through the gateway.
// Register (user scope):  claude mcp add -s user sami-media -- node "Z:/SAMI_Video/SAMI_Motion_Studio/providers/mcp.mjs"
// Never put mcp__sami-media__generate in an allowlist: Claude Code then asks Tuấn before every paid call.
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import * as G from './gateway.mjs';
import * as library from '../server/library.mjs';

import fs from 'fs';
const VERSION = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const server = new McpServer({name: 'sami-media', version: VERSION}, {instructions:
  'SAMI media gateway. Order: SAMI_Library (library_search) → free stock (search_stock/fetch_stock) → subscriptions in the browser (provider *-web: follow the recipe, then ingest_file) → paid APIs. ' +
  'Paid generation: call estimate, show Tuấn the provider, model, units and USD, WAIT for his explicit OK in chat, then call generate with the confirm_token. One paid call at a time; never retry a failed paid call on your own. ' +
  'Never generate images with ElevenLabs. Images never contain on-screen text (copy lives in project.json).'});
const text = (x) => ({content: [{type: 'text', text: typeof x === 'string' ? x : JSON.stringify(x, null, 1)}]});
const fail = (e) => ({isError: true, content: [{type: 'text', text: '✗ ' + (e?.message || e)}]});
const wrap = (fn) => async (args) => { try { return text(await fn(args)); } catch (e) { return fail(e); } };
const seen = new Map(); // provider:id → stock item from search_stock (fetch_stock looks them up here)

const genArgs = {
  provider: z.string().describe('adapter id, e.g. elevenlabs-tts, openai-image, gemini-image, edge-tts, synth-sfx'),
  kind: z.enum(['img', 'video', 'music', 'sfx', 'voice']).optional(),
  prompt: z.string().describe('prompt / spoken text / SFX name'),
  n: z.number().int().min(1).max(10).optional(),
  model: z.string().optional(), ratio: z.string().optional().describe('1:1, 9:16, 16:9, 4:5…'),
  seconds: z.number().optional(), voice: z.string().optional(),
  opts: z.record(z.string(), z.any()).optional(),
  project_dir: z.string().optional().describe('save into <project>/public/… instead of SAMI_Library'),
};
const reqOf = (a) => ({provider: a.provider, kind: a.kind, prompt: a.prompt, n: a.n, model: a.model, ratio: a.ratio, seconds: a.seconds, voice: a.voice, opts: a.opts, dest: a.project_dir || 'library'});

server.registerTool('list_providers', {description: 'List media providers: kinds, paid/free/web/stock, key set or not (never the key), availability, defaults, licence.', inputSchema: {}},
  wrap(async () => (await G.listProviders()).map(({defaults, voices, ...p}) => ({...p, defaults, voices}))));

server.registerTool('search_stock', {description: 'Search free stock (Pexels, Pixabay, Unsplash, Wikimedia; licence-filtered). provider "auto" = every stock source that has a key.',
  inputSchema: {q: z.string(), kind: z.enum(['img', 'video']).optional(), provider: z.string().optional(), orientation: z.enum(['portrait', 'landscape', 'square']).optional(), limit: z.number().int().min(1).max(40).optional()}},
  wrap(async (a) => {
    const r = await G.searchStock({provider: a.provider || 'auto', q: a.q, kind: a.kind || 'img', orientation: a.orientation, perPage: a.limit || 12});
    for (const it of r.items) seen.set(it.provider + ':' + it.id, it);
    return {errors: r.errors, items: r.items.map(({dl, ...it}) => it)};
  }));

server.registerTool('fetch_stock', {description: 'Download one stock item found by search_stock into SAMI_Library (default) or a project, with licence + author meta.',
  inputSchema: {provider: z.string(), id: z.string(), project_dir: z.string().optional()}},
  wrap(async (a) => { const it = seen.get(a.provider + ':' + a.id); if (!it) throw new Error('Chưa thấy mục này: gọi search_stock trước'); const r = await G.fetchStock(it, {dest: a.project_dir || 'library', confirmedBy: 'claude-mcp'}); return {uri: r.uri, rel: r.rel, path: r.path, licence: r.meta.licence}; }));

server.registerTool('estimate', {description: 'Estimate cost of a generation. Paid providers return a confirm_token (10 min, one use, bound to this exact request) unless the daily/monthly cap would be exceeded. Show the estimate to Tuấn and wait for his OK before generate.',
  inputSchema: genArgs},
  wrap(async (a) => { const e = await G.estimate(reqOf(a)); const {request, token, ...rest} = e; return {...rest, confirm_token: token || null}; }));

server.registerTool('generate', {description: 'Run a generation. Paid providers REQUIRE confirm_token from estimate, only after Tuấn approved the cost in chat. Free/local providers ignore the token. Browser (*-web) providers cannot run here: use their recipe, then ingest_file.',
  inputSchema: {...genArgs, confirm_token: z.string().optional()}},
  wrap(async (a) => { const r = await G.generate(reqOf(a), {token: a.confirm_token, confirmedBy: 'claude-mcp (Tuấn OK trong chat)'}); return {usd: r.usd, files: r.files.map((f) => ({uri: f.uri, rel: f.rel, path: f.path, duplicate: f.duplicate}))}; }));

server.registerTool('ingest_file', {description: 'Register a file downloaded by hand or by a browser recipe (chatgpt-web, gemini-web, flow-web, suno-web, manual): copies it into SAMI_Library or a project with prompt + licence meta.',
  inputSchema: {file: z.string(), provider: z.string(), kind: z.enum(['img', 'video', 'music', 'sfx', 'voice']).optional(), prompt: z.string().optional(), model: z.string().optional(), title: z.string().optional(), project_dir: z.string().optional(), note: z.string().optional()}},
  wrap(async (a) => { const r = G.ingestFile({...a, dest: a.project_dir || 'library', confirmedBy: 'claude-mcp'}); return {uri: r.uri, rel: r.rel, path: r.path, duplicate: r.duplicate}; }));

server.registerTool('library_search', {description: 'Search SAMI_Library (music, sfx, voice, img, video, lottie…). Returns lib: URIs usable in project.json and scenes.',
  inputSchema: {q: z.string().optional(), kind: z.string().optional(), limit: z.number().int().optional()}},
  wrap(async (a) => library.search({q: a.q || '', kind: a.kind || null, limit: a.limit || 30}).map((it) => ({uri: it.uri, title: it.title, tags: it.tags, licence: it.licence?.name || it.licence || null, duration: it.duration, w: it.w, h: it.h}))));

server.registerTool('ledger', {description: 'Cost ledger: spent today / this month vs caps, per provider, recent calls, pending confirm tokens.', inputSchema: {limit: z.number().int().optional()}},
  wrap(async (a) => ({...G.ledgerSummary({limit: a.limit || 15}), pendingTokens: G.pendingTokens()})));

await server.connect(new StdioServerTransport());
