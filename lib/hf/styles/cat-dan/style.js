/* Phong cách Tư liệu cắt dán giấy: chuyển động riêng (tuỳ chọn). Chạy trước script của cảnh; mọi thứ phải là hàm của timeline.
 * Cảnh / khuôn gọi: if (SAMI.style && SAMI.styleFx) SAMI.styleFx.enter(tl, el, at). */
(function () {
  var S = window.SAMI; if (!S) return;
  S.styleFx = {
    /** cách một phần tử xuất hiện trong phong cách này (mặc định: trồi lên + bỏ nhoè, như SAMI.arrive) */
    enter: function (tl, el, at, o) { return S.arrive(tl, el, at, o || {}); },
  };
})();
