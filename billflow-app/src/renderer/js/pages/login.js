window.PageControllers = window.PageControllers || {};
window.PageControllers['login'] = {
  init: function() {
    var emailEl  = document.getElementById('login-email');
    var passEl   = document.getElementById('login-password');
    var btnEl    = document.getElementById('login-btn');
    var errorEl  = document.getElementById('login-error');

    var manualLogout = localStorage.getItem('manual_logout');
    if (manualLogout === 'true') {
      localStorage.removeItem('manual_logout');
    }

    // ── Rate Limiting ──────────────────────────────────────────────────────────
    var MAX_ATTEMPTS = 5;
    var LOCKOUT_DURATIONS = [0, 0, 0, 30, 60, 300]; // seconds: 0,0,0,30s,60s,5min
    var lockoutTimer = null;

    function getAttemptData() {
      try {
        var data = JSON.parse(localStorage.getItem('billflow_login_attempts') || '{}');
        return {
          count: parseInt(data.count, 10) || 0,
          lockedUntil: parseInt(data.lockedUntil, 10) || 0
        };
      } catch (e) { return { count: 0, lockedUntil: 0 }; }
    }

    function setAttemptData(count, lockedUntil) {
      localStorage.setItem('billflow_login_attempts', JSON.stringify({
        count: count,
        lockedUntil: lockedUntil || 0
      }));
    }

    function resetAttempts() {
      localStorage.removeItem('billflow_login_attempts');
      if (lockoutTimer) { clearInterval(lockoutTimer); lockoutTimer = null; }
    }

    function isLockedOut() {
      var data = getAttemptData();
      if (data.lockedUntil && Date.now() < data.lockedUntil) {
        return true;
      }
      if (data.lockedUntil && Date.now() >= data.lockedUntil) {
        // Lockout expired — keep attempt count but clear timer
        setAttemptData(data.count, 0);
      }
      return false;
    }

    function startLockoutCountdown() {
      var data = getAttemptData();
      if (!data.lockedUntil) return;

      btnEl.disabled = true;
      if (lockoutTimer) clearInterval(lockoutTimer);

      lockoutTimer = setInterval(function() {
        var remaining = Math.ceil((data.lockedUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(lockoutTimer);
          lockoutTimer = null;
          btnEl.disabled = false;
          btnEl.textContent = 'Unlock Database';
          clearError();
        } else {
          var mins = Math.floor(remaining / 60);
          var secs = remaining % 60;
          var timeStr = mins > 0 ? mins + 'm ' + secs + 's' : secs + 's';
          btnEl.textContent = 'Locked (' + timeStr + ')';
          showError('Too many failed attempts. Please wait ' + timeStr + ' before trying again.');
        }
      }, 1000);
    }

    function recordFailedAttempt() {
      var data = getAttemptData();
      var newCount = data.count + 1;
      var lockoutDuration = LOCKOUT_DURATIONS[Math.min(newCount, LOCKOUT_DURATIONS.length - 1)];
      var lockedUntil = lockoutDuration > 0 ? Date.now() + (lockoutDuration * 1000) : 0;
      setAttemptData(newCount, lockedUntil);

      if (lockedUntil > 0) {
        startLockoutCountdown();
      }

      if (newCount >= MAX_ATTEMPTS) {
        showError('Account locked for 5 minutes due to too many failed attempts.');
      }
    }
    // ── End Rate Limiting ──────────────────────────────────────────────────────

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
    function clearError() { errorEl.style.display = 'none'; }

    // Check if already locked out on page load
    if (isLockedOut()) {
      startLockoutCountdown();
    }

    btnEl.addEventListener('click', function() {
      clearError();

      // Check lockout
      if (isLockedOut()) {
        startLockoutCountdown();
        return;
      }

      var email    = (emailEl.value || '').trim();
      var password = passEl.value || '';

      if (!email || !password) {
        return showError('Please enter your email and password.');
      }

      btnEl.disabled     = true;
      btnEl.textContent  = 'Unlocking...';

      setTimeout(function() {
        window.api.login(email, password).then(function(result) {
          btnEl.disabled    = false;
          btnEl.textContent = 'Unlock Database';
          passEl.value      = '';

          if (result.success) {
            resetAttempts(); // Clear lockout on success
            if (result.warning) { console.warn('[login]', result.warning); }
            document.getElementById('user-email').textContent = result.email || email;
            window.showSidebar && window.showSidebar(true);
            window.loadPage('dashboard');
          } else {
            recordFailedAttempt();
            var data = getAttemptData();
            var remaining = MAX_ATTEMPTS - data.count;
            var baseMsg = result.error || 'Login failed. Please check your password.';
            if (remaining > 0 && remaining <= 3) {
              baseMsg += ' (' + remaining + ' attempt' + (remaining > 1 ? 's' : '') + ' remaining)';
            }
            showError(baseMsg);
          }
        }).catch(function(err) {
          btnEl.disabled    = false;
          btnEl.textContent = 'Unlock Database';
          recordFailedAttempt();
          showError('Unexpected error: ' + err.message);
        });
      }, 50);
    });

    passEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) { btnEl.click(); }
    });
  }
};
