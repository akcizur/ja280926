(function () {
  function mark(a) {
    var href=a.getAttribute('href'); if(!href)return;
    try { var u=new URL(href,document.baseURI); if((u.protocol==='http:'||u.protocol==='https:')&&u.host!==location.host){a.target='_blank';a.rel='noopener noreferrer';} } catch(e){}
  }
  function scan(){document.querySelectorAll('a[href]').forEach(mark)}
  if(document.readyState!=='loading')scan();else document.addEventListener('DOMContentLoaded',scan);
  document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(a)mark(a)},true);
})();
