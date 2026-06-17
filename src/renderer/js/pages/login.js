window.PageControllers = window.PageControllers || {};
window.PageControllers['login'] = {
  init: function() {
    var emailEl  = document.getElementById('login-email');
    var passEl   = document.getElementById('login-password');
    var btnEl    = document.getElementById('login-btn');
    var errorEl  = document.getElementById('login-error');

    if (emailEl) emailEl.value = 'gopeshkachhadiya00005@gmail.com';
    if (passEl) passEl.value = 'Gopesh@007';

    function showError(msg) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
    function clearError() { errorEl.style.display = 'none'; }

    btnEl.addEventListener('click', function() {
      clearError();
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
            if (result.warning) { console.warn('[login]', result.warning); }
            document.getElementById('user-email').textContent = result.email || email;
            window.showSidebar && window.showSidebar(true);
            window.loadPage('dashboard');
          } else {
            showError(result.error || 'Login failed. Please check your password.');
          }
        }).catch(function(err) {
          btnEl.disabled    = false;
          btnEl.textContent = 'Unlock Database';
          showError('Unexpected error: ' + err.message);
        });
      }, 50);
    });

    passEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) { btnEl.click(); }
    });
  }
};
