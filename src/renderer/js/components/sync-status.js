var SyncStatus = (function() {
  function update() {
    if (!window.api) return;
    window.api.getPendingSyncCount().then(function(count) {
      var badge = document.getElementById('sync-badge');
      if (!badge) return;
      if (count === 0) {
        badge.textContent = '● Synced';
        badge.style.color = '#0E9F6E';
      } else {
        badge.textContent = '● ' + count + ' pending';
        badge.style.color = '#FF8A00';
      }
    }).catch(function() {});
  }
  setInterval(update, 30000);
  return { update: update };
}());
