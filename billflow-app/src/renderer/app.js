var currentPage = null;
var pageCache   = {};
var sessionRefreshInterval = null;

// ── Session Auto-Refresh ──────────────────────────────────────────────────────
var SESSION_REFRESH_MS = 45 * 60 * 1000; // 45 minutes

function startSessionRefresh() {
  stopSessionRefresh();
  sessionRefreshInterval = setInterval(function() {
    window.api.refreshSession().then(function(result) {
      if (result && result.ok) {
        console.log('[session] Token refreshed successfully');
      }
    }).catch(function(err) {
      console.warn('[session] Token refresh failed:', err);
    });
  }, SESSION_REFRESH_MS);
}

function stopSessionRefresh() {
  if (sessionRefreshInterval) {
    clearInterval(sessionRefreshInterval);
    sessionRefreshInterval = null;
  }
}

function loadPage(pageName, params) {
  // Authentication Guard: Prevent unauthorized navigation to protected pages
  if (pageName !== 'login') {
    if (!window.api || typeof window.api.isLoggedIn !== 'function') {
      return loadPage('login');
    }
    window.api.isLoggedIn().then(function(loggedIn) {
      if (!loggedIn) {
        showSidebar(false);
        updateTopbar('');
        if (currentPage !== 'login') {
          loadPage('login');
        }
        return;
      }
      _doLoadPage(pageName, params);
    }).catch(function() {
      showSidebar(false);
      updateTopbar('');
      loadPage('login');
    });
    return;
  }
  _doLoadPage(pageName, params);
}

function _doLoadPage(pageName, params) {
  if (currentPage === pageName && !params) return;
  currentPage = pageName;

  var links = document.querySelectorAll('[data-page]');
  for (var i = 0; i < links.length; i++) {
    links[i].classList.remove('active');
    if (links[i].getAttribute('data-page') === pageName) {
      links[i].classList.add('active');
    }
  }

  var content = document.getElementById('content');
  content.innerHTML = '<div class="page-loading">Loading...</div>';

  var xhr = new XMLHttpRequest();
  // Append timestamp to bust any browser-level caching (CQ-05)
  xhr.open('GET', 'pages/' + pageName + '.html?t=' + new Date().getTime(), true);
  xhr.onload = function() {
    if (xhr.status === 200 || xhr.status === 0) { // status 0 is for local file:// protocol
      renderPage(pageName, xhr.responseText, params);
    } else {
      content.innerHTML = '<div class="error">Page not found: ' + pageName + '</div>';
    }
  };
  xhr.onerror = function() {
    content.innerHTML = '<div class="error">Failed to load page</div>';
  };
  xhr.send();
}

function renderPage(pageName, html, params) {
  var content = document.getElementById('content');
  content.innerHTML = html;
  window._pageParams = params || {};

  var scriptId = 'page-script-' + pageName;
  var oldScript = document.getElementById(scriptId);
  if (oldScript) { oldScript.parentNode.removeChild(oldScript); }

  var script    = document.createElement('script');
  script.id     = scriptId;
  script.src    = 'js/pages/' + pageName + '.js';
  script.onload = function() {
    if (window.PageControllers && window.PageControllers[pageName]) {
      window.PageControllers[pageName].init(params || {});
    }
  };
  document.body.appendChild(script);
}

function showSidebar(show) {
  var sidebar = document.getElementById('sidebar');
  var logoutBtn = document.getElementById('logout-btn');
  if (sidebar) sidebar.style.display = show ? '' : 'none';
  if (logoutBtn) logoutBtn.style.display = show ? '' : 'none';
}

function updateTopbar(email) {
  var el = document.getElementById('user-email');
  if (el) el.textContent = email || '';
}

document.addEventListener('DOMContentLoaded', function() {
  // Global Event Delegation for all [data-page] navigation links and buttons
  document.addEventListener('click', function(e) {
    var target = e.target.closest ? e.target.closest('[data-page]') : null;
    if (target) {
      e.preventDefault();
      var page = target.getAttribute('data-page');
      if (page) {
        loadPage(page);
      }
    }
  });

  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.setItem('manual_logout', 'true');
      stopSessionRefresh(); // Stop refresh timer on logout
      window.api.logout().then(function() {
        updateTopbar('');
        showSidebar(false);
        loadPage('login');
      });
    });
  }

  window.api.isLoggedIn().then(function(loggedIn) {
    if (loggedIn) {
      window.api.getSession().then(function(session) {
        if (session && session.email) { updateTopbar(session.email); }
      });
      showSidebar(true);
      startSessionRefresh(); // Start auto-refresh on login
      loadPage('dashboard');
    } else {
      showSidebar(false);
      loadPage('login');
    }
  });

  if (window.SyncStatus) { window.SyncStatus.update(); }

  var logoWrapper = document.getElementById('topbar-logo-wrapper');
  if (logoWrapper) {
    logoWrapper.addEventListener('click', function() {
      if (window.api && window.api.isLoggedIn) {
        window.api.isLoggedIn().then(function(loggedIn) {
          if (loggedIn) {
            loadPage('dashboard');
          } else {
            loadPage('login');
          }
        });
      } else {
        loadPage('login');
      }
    });
  }

  // OTA Auto-Updater Event Listener
  if (window.api && window.api.onUpdateStatus) {
    window.api.onUpdateStatus(function(data) {
      console.log('[OTA Updater]', data);
      if (data.status === 'available') {
        if (window.Toast) window.Toast.show(data.message, 'info', 5000);
      } else if (data.status === 'downloaded') {
        if (window.Toast) window.Toast.show(data.message, 'success', 10000);
        var banner = document.getElementById('update-banner');
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'update-banner';
          banner.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #2563eb; color: #ffffff; text-align: center; padding: 10px; font-size: 13px; font-weight: bold; z-index: 99999; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
          banner.innerHTML = '🚀 New BillFlow Update (v' + (data.info && data.info.version || '') + ') Ready! Click here to restart & apply GST tax updates.';
          banner.onclick = function() {
            window.api.quitAndInstall();
          };
          document.body.appendChild(banner);
        }
      }
    });
  }

  // ── ARCH-02 Mitigation: Offline UX Blocker ──────────────────────────────────
  function updateOnlineStatus() {
    var overlay = document.getElementById('offline-overlay');
    if (!overlay) return;
    if (navigator.onLine) {
      overlay.style.display = 'none';
    } else {
      overlay.style.display = 'flex';
    }
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus(); // initial check

});

window.loadPage = loadPage;
window.showSidebar = showSidebar;
window.startSessionRefresh = startSessionRefresh;

