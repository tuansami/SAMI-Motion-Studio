export const meta = {
  name: 'sami-motion-video',
  description: 'SAMI Motion Studio team: plan (script+storyboard into project.json) or build/revise scenes for every ratio with stills QA and preflight',
  whenToUse: 'Run inside a SAMI Motion Studio project folder (has project.json). args.stage = "plan" (storyboard + project.json scenes/copy, then stop for approval) or "build" (build/revise listed scenes, QA every ratio, validate). The user renders in the Studio app.',
  phases: [
    {title: 'Plan', detail: 'scriptwriter + storyboard → brief/SCRIPT_STORYBOARD.md, project.json scenes + copy'},
    {title: 'Build', detail: 'one motion designer per scene, stills QA in each ratio'},
    {title: 'Verify', detail: 'cli-validate + contact-sheet critic'},
  ],
}

// args: { stage: 'plan'|'build', app?: 'D:/…/SAMI_Motion_Studio', brief?: string, scenes?: [{id:'S04', change:'...'}], music?: 'public/audio/music.mp3' }
const A = args || {}
const stage = A.stage || 'build'
const APP = A.app || '(absolute app path — see CLAUDE.md in this folder)'
const RULES = `Follow CLAUDE.md in this folder and ${APP}/docs/PROJECT_GUIDE.md. One easing (tw/keys/arrive from @engine/lib/anim), time via useT(), beat grid 15n+1, every on-screen string in project.json → copy (with a Vietnamese label describing where it appears), layouts per ratio with usePick/useFormat for every ratio in project.json formats. Touch only the files your task names.`

const PLAN = {type: 'object', properties: {
  scenes: {type: 'array', items: {type: 'object', properties: {id: {type: 'string'}, start: {type: 'number'}, end: {type: 'number'}, spec: {type: 'string'}}, required: ['id', 'start', 'end', 'spec']}},
  totalFrames: {type: 'number'}, questions: {type: 'array', items: {type: 'string'}},
}, required: ['scenes', 'totalFrames']}
const QA = {type: 'object', properties: {pass: {type: 'boolean'}, issues: {type: 'array', items: {type: 'string'}}}, required: ['pass', 'issues']}

if (stage === 'plan') {
  phase('Plan')
  const grid = A.music ? await agent(`Run \`node "${APP}/server/cli-grid.mjs" ${A.music}\` and return its stdout verbatim.`, {label: 'music grid', effort: 'low'}) : 'no music yet — plan on a 120 BPM grid (beat = 15 f, cuts at 15n+1)'
  const plan = await agent(`You are the Scriptwriter + Storyboard artist for a SAMI motion ad.
Brief:\n${A.brief || '(read brief/BRIEF.md and every file in brief/)'}\n\nMusic grid:\n${grid}\n
Write brief/SCRIPT_STORYBOARD.md (table: scene · frames · seconds · Vietnamese on-screen copy · visual/motion per ratio · SFX). Then update project.json: scenes (contiguous, cuts on beats, DROP and FINAL HIT on cut-ins, Vietnamese labels, animLength = end - start, warp null), copy (every line, labelled), audio.cues (few SFX). Copy must sound natural read aloud; respect reading time; never invent statistics or prices. ${RULES}
Return the scene plan.`, {label: 'script + storyboard', schema: PLAN})
  log(`Plan: ${plan.scenes.length} scenes, ${(plan.totalFrames / 30).toFixed(1)}s — review brief/SCRIPT_STORYBOARD.md (and the Studio preview), then run stage "build".`)
  return plan
}

// ── BUILD / REVISE ───────────────────────────────────────────────
const scenes = A.scenes && A.scenes.length ? A.scenes : await agent('Read project.json and brief/SCRIPT_STORYBOARD.md. Return every scene id with its storyboard row as `change`.', {label: 'list scenes', effort: 'low', schema: {type: 'object', properties: {scenes: {type: 'array', items: {type: 'object', properties: {id: {type: 'string'}, change: {type: 'string'}}, required: ['id', 'change']}}}, required: ['scenes']}}).then((r) => r.scenes)
log(`Building ${scenes.length} scene(s): ${scenes.map((s) => s.id).join(', ')}`)

const stills = (id, tag) => `For each ratio in project.json formats run \`node "${APP}/server/cli-still.mjs" . out/qa/${id}${tag}_<ratio>.jpg <4-6 GLOBAL frames inside the scene (start..end from project.json)> <ratio>\` (ratio like 9:16; replace ':' by 'x' in the file name) and Read every image.`

const results = await pipeline(
  scenes,
  (s) => agent(`You are a senior Motion Designer. Scene ${s.id}. Task:\n${s.change}\n
Edit only scenes/${s.id}.tsx (and scenes/parts/${s.id}_*.tsx if needed); register it in scenes/index.ts if new; add/adjust only ${s.id}_* keys in project.json → copy. ${stills(s.id, '')} Iterate at least twice until showreel quality in every ratio. ${RULES}
Return a 3-line summary.`, {label: `build ${s.id}`, phase: 'Build'}),
  (summary, s) => agent(`You are the QA lead. Scene ${s.id} was just built (${summary}). ${stills(s.id, '-qa')} Judge strictly: clipped/overlapping elements, text < 20 px, Vietnamese diacritics, content in unsafe zones on 9:16, off-beat landings, dead frames, off-brand colours, raw screenshots as content, invented numbers. pass=false if any real issue.`, {label: `QA ${s.id}`, phase: 'Build', schema: QA}),
  (qa, s) => qa.pass ? {id: s.id, qa} : agent(`Fix these QA issues in scene ${s.id} (only its files):\n- ${qa.issues.join('\n- ')}\n${stills(s.id, '-fix')} Confirm each issue is fixed. ${RULES} Return what you changed.`, {label: `fix ${s.id}`, phase: 'Build'}).then((fix) => ({id: s.id, qa, fix})),
)

phase('Verify')
const verify = await agent(`Run \`node "${APP}/server/cli-validate.mjs" .\` and report its output verbatim. Render one still per scene (middle frame) in the first ratio with cli-still and Read them as a set. Report broken scenes and what is still missing before the user exports in the Studio (draft first, then final). Be a completeness critic.`, {label: 'preflight + critic', phase: 'Verify', schema: QA})
return {scenes: results.filter(Boolean), verify}
