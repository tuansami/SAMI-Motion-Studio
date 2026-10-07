/* Studio ↔ cảnh Hyperframes trong iframe preview (chỉ chèn khi xem trước, KHÔNG có khi render).
 * Nhận {sami:'seek', t, id} → __player.renderSeek(t) → sau 2 khung vẽ gửi {sami:'seeked', id}.
 * Nhận {sami:'data', data} (chữ/màu đang sửa trong Studio, chưa lưu) → lưu sessionStorage rồi nạp lại cảnh với dữ liệu mới.
 * Tắt tiếng mọi media trong cảnh: âm thanh của video chỉ lấy từ project.json → audio. */
(function () {
  'use strict';
  var pending = null, busy = false;
  var ready = function () { return window.__player && typeof window.__player.renderSeek === 'function'; };
  var mute = function () { document.querySelectorAll('audio,video').forEach(function (m) { m.muted = true; }); };
  var run = function () {
    if (busy || pending == null || !ready()) return;
    busy = true; var job = pending; pending = null;
    try { window.__player.renderSeek(Math.max(0, job.t)); } catch (e) { /* cảnh lỗi: vẫn trả lời để Studio không chờ */ }
    mute();
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      busy = false;
      try { parent.postMessage({sami: 'seeked', id: job.id, t: job.t}, '*'); } catch (e) {}
      run();
    }); });
  };
  var KEY = 'sami:' + (window.SAMI && SAMI.scene) + ':' + (window.SAMI && SAMI.ratio), dataT = null;
  var applied = function () { try { return sessionStorage.getItem(KEY) || window.__samiData || ''; } catch (e) { return window.__samiData || ''; } };
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d) return;
    if (d.sami === 'seek') { pending = {t: +d.t || 0, id: d.id}; run(); return; }
    if (d.sami === 'data' && typeof d.data === 'string' && d.data !== applied()) {
      clearTimeout(dataT);
      dataT = setTimeout(function () { try { sessionStorage.setItem(KEY, d.data); } catch (x) {} location.reload(); }, 350);
    }
  });
  var poll = setInterval(function () { if (ready()) { clearInterval(poll); mute(); try { parent.postMessage({sami: 'ready', duration: window.__player.getDuration ? window.__player.getDuration() : null}, '*'); } catch (e) {} run(); } }, 50);
  window.addEventListener('error', function (e) { try { parent.postMessage({sami: 'error', message: String(e.message || e)}, '*'); } catch (x) {} });
})();
