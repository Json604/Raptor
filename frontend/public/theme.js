// Raptor is light by default. If the visitor switched to dark (saved by the nav
// switch), apply it before the page paints so there's no white flash.
(function () {
  var dark = false
  try { dark = localStorage.getItem('raptor-theme') === 'dark' } catch (e) {}
  if (!dark) return
  document.documentElement.setAttribute('data-theme', 'dark')
  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', '#000000')
  var scheme = document.querySelector('meta[name="color-scheme"]')
  if (scheme) scheme.setAttribute('content', 'dark')
})()
