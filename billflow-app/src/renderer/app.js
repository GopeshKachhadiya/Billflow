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

  if (pageCache[pageName]) {
    renderPage(pageName, pageCache[pageName], params);
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'pages/' + pageName + '.html', true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      pageCache[pageName] = xhr.responseText;
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
  var links = document.querySelectorAll('[data-page]');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function(e) {
      e.preventDefault();
      loadPage(this.getAttribute('data-page'));
    });
  }

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
});

window.loadPage = loadPage;
window.showSidebar = showSidebar;
window.startSessionRefresh = startSessionRefresh;

