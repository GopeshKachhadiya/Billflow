var SyncStatus = (function() {
  function update() {
    if (!window.api) return;
    
    // Trigger sync automatically before checking counts
    window.api.syncNow().then(function() {
      return window.api.getPendingSyncCount();
    }).then(function(count) {
      var badge = document.getElementById('sync-badge');
      if (!badge) return;
      if (count === 0) {
        badge.textContent = '● Synced';
        badge.style.color = '#0E9F6E';
      } else {
        badge.textContent = '● ' + count + ' pending';
        badge.style.color = '#FF8A00';
      }
    }).catch(function() {
      // Fallback in case of offline/errors
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
    });
  }

  // Setup event listeners once DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    var badge = document.getElementById('sync-badge');
    if (badge) {
      badge.style.cursor = 'pointer';
      badge.title = 'Click to force sync now';
      badge.addEventListener('click', function() {
        badge.textContent = '● Syncing...';
        badge.style.color = '#FF8A00';
        window.api.syncNow().then(function() {
          update();
        }).catch(function() {
          update();
        });
      });
    }
    // Delay first update slightly on load
    setTimeout(update, 2000);
  });

  setInterval(update, 30000);
  return { update: update };
}());
