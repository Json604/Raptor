// Raptor is dark by default. If the visitor switched to light (saved by the nav
// switch), keep that; either way it's applied before the page paints, so no flash.
(function () {
  var light = false
  try { light = localStorage.getItem('raptor-theme') === 'light' } catch (e) {}
  if (light) return
  document.documentElement.setAttribute('data-theme', 'dark')
  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', '#000000')
  var scheme = document.querySelector('meta[name="color-scheme"]')
  if (scheme) scheme.setAttribute('content', 'dark')
})()
