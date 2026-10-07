// Test adapters for the selftest (only registered when SAMI_PROVIDERS_TEST=1). They never touch the network.
import fs from 'fs';
import path from 'path';

// 1×1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const make = (ctx, n, tag) => Array.from({length: n}, (_, i) => { const f = path.join(ctx.tmp, `${tag}-${i}.png`); fs.writeFileSync(f, PNG); return {file: f, ext: '.png', title: 'mock ' + i}; });
export const mockFree = {id: 'mock-free', label: 'Mock miễn phí', kinds: ['img'], paid: false, free: true, licence: {name: 'test', commercial: true},
  estimate: () => ({usd: 0, units: '1'}), async run(req, ctx) { return {files: make(ctx, req.n || 1, 'free'), model: 'mock'}; }};
export const mockPaid = {id: 'mock-paid', label: 'Mock trả tiền', kinds: ['img'], paid: true, licence: {name: 'test', commercial: true},
  estimate: (req) => ({usd: 0.5 * (req.n || 1), units: `${req.n || 1} ảnh`}),
  async run(req, ctx) { if (req.opts?.fail) throw Object.assign(new Error('mock lỗi'), {sent: true}); return {files: make(ctx, req.n || 1, 'paid'), model: 'mock', usd: 0.4 * (req.n || 1)}; }};
export const mockStock = {id: 'mock-stock', label: 'Mock stock', kinds: ['img'], stock: true, paid: false, licence: {name: 'test', commercial: true},
  async search(q) { return [{provider: 'mock-stock', id: '1', kind: 'img', title: q, thumb: null, w: 1, h: 1, author: 'Tester', page: 'https://example.org/1', dl: {url: 'mock://1'}}]; },
  async fetch(it, ctx) { const f = path.join(ctx.tmp, 'stock.png'); fs.writeFileSync(f, PNG); return {file: f, ext: '.png', licence: {name: 'test', commercial: true, credit: 'Tester'}}; }};
export default [mockFree, mockPaid, mockStock];
