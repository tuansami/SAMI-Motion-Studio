// Subscription web apps driven by Claude through the browser-harness skill (Tuấn's real Chrome, Tuấn logged in).
// The gateway never runs these: Claude follows providers/recipes/<recipe>.md, downloads the results, then calls
// ingest (CLI `ingest`, MCP `ingest_file`, UI) with provider=<id> so every file gets prompt + licence meta.
const web = (id, label, kinds, recipe, licence) => ({id, label, kinds, web: true, paid: false, needsHuman: true, recipe: `providers/recipes/${recipe}.md`, licence,
  estimate: () => ({usd: 0, units: 'gói web (không tính phí API)', notes: 'Chạy bằng trình duyệt: Tuấn phải có mặt và đã đăng nhập.'}),
  run() { throw new Error(`${label} chạy qua trình duyệt: làm theo ${this.recipe} rồi dùng ingest.`); }});

export default [
  web('chatgpt-web', 'ChatGPT (web)', ['img'], 'chatgpt-image', {name: 'OpenAI Terms: người dùng sở hữu đầu ra', url: 'https://openai.com/policies/terms-of-use', commercial: true, notes: 'Gom 5 ảnh một lệnh.'}),
  web('gemini-web', 'Gemini (web)', ['img'], 'gemini-image', {name: 'Google Generative AI Terms (watermark SynthID ẩn)', url: 'https://policies.google.com/terms/generative-ai', commercial: true}),
  web('flow-web', 'Google Flow / Veo (web)', ['video'], 'flow-veo', {name: 'Google Flow Terms', url: 'https://labs.google/flow/about', commercial: 'check', notes: 'Kiểm watermark hiển thị theo gói; Veo có SynthID.'}),
  web('suno-web', 'Suno (web)', ['music'], 'suno', {name: 'Suno Terms', url: 'https://suno.com/terms', commercial: 'check', notes: 'Chỉ bài tạo khi đang ở gói Pro/Premier mới được dùng thương mại.'}),
];
