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

    // ── 3-STEP OTP FORGOT PASSWORD CONTROLLER ────────────────────────────────────
    var forgotLink     = document.getElementById('forgot-pass-link');
    var resetModal     = document.getElementById('reset-modal');
    var closeResetModal= document.getElementById('close-reset-modal');
    var resetMsgEl     = document.getElementById('reset-msg');
    var resetStep1     = document.getElementById('reset-step-1');
    var resetStep2     = document.getElementById('reset-step-2');
    var resetStep3     = document.getElementById('reset-step-3');

    var resetEmailInput = document.getElementById('reset-email');
    var resetOtpInput   = document.getElementById('reset-otp');
    var resetNewPass    = document.getElementById('reset-new-pass');
    var resetConfirmPass= document.getElementById('reset-confirm-pass');

    var btnSendOtp      = document.getElementById('btn-send-otp');
    var btnVerifyOtp    = document.getElementById('btn-verify-otp');
    var btnUpdatePass   = document.getElementById('btn-update-pass');

    var activeResetEmail = '';

    function showResetMsg(msg, isSuccess) {
      resetMsgEl.textContent = msg;
      resetMsgEl.style.display = 'block';
      resetMsgEl.style.backgroundColor = isSuccess ? '#dcfce7' : '#fee2e2';
      resetMsgEl.style.color = isSuccess ? '#15803d' : '#b91c1c';
      resetMsgEl.style.border = '1px solid ' + (isSuccess ? '#bbf7d0' : '#fca5a5');
    }
    function clearResetMsg() { resetMsgEl.style.display = 'none'; }

    if (forgotLink && resetModal) {
      forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        clearResetMsg();
        resetEmailInput.value = (emailEl.value || '').trim();
        resetOtpInput.value = '';
        resetNewPass.value = '';
        resetConfirmPass.value = '';
        resetStep1.style.display = 'block';
        resetStep2.style.display = 'none';
        resetStep3.style.display = 'none';
        resetModal.style.display = 'flex';
      });

      if (closeResetModal) {
        closeResetModal.addEventListener('click', function() {
          resetModal.style.display = 'none';
        });
      }

      // STEP 1: Send OTP
      if (btnSendOtp) {
        btnSendOtp.addEventListener('click', function() {
          clearResetMsg();
          activeResetEmail = (resetEmailInput.value || '').trim();
          if (!activeResetEmail) {
            return showResetMsg('Please enter your registered email address.', false);
          }

          btnSendOtp.disabled = true;
          btnSendOtp.textContent = 'Sending OTP...';

          window.api.sendResetOTP(activeResetEmail).then(function(res) {
            btnSendOtp.disabled = false;
            btnSendOtp.textContent = 'Send Verification OTP';
            if (res && res.success) {
              showResetMsg('6-digit OTP code sent! Please check your email.', true);
              resetStep1.style.display = 'none';
              resetStep2.style.display = 'block';
            } else {
              showResetMsg(res.error || 'Failed to send OTP code.', false);
            }
          }).catch(function(err) {
            btnSendOtp.disabled = false;
            btnSendOtp.textContent = 'Send Verification OTP';
            showResetMsg('Request failed: ' + err.message, false);
          });
        });
      }

      // STEP 2: Verify OTP
      if (btnVerifyOtp) {
        btnVerifyOtp.addEventListener('click', function() {
          clearResetMsg();
          var otp = (resetOtpInput.value || '').trim();
          if (!otp) {
            return showResetMsg('Please enter the 6-digit OTP code.', false);
          }

          btnVerifyOtp.disabled = true;
          btnVerifyOtp.textContent = 'Verifying...';

          window.api.verifyResetOTP(activeResetEmail, otp).then(function(res) {
            btnVerifyOtp.disabled = false;
            btnVerifyOtp.textContent = 'Verify Code';
            if (res && res.success) {
              showResetMsg('OTP Verified! Enter your new password below.', true);
              resetStep2.style.display = 'none';
              resetStep3.style.display = 'block';
            } else {
              showResetMsg(res.error || 'Invalid OTP verification code.', false);
            }
          }).catch(function(err) {
            btnVerifyOtp.disabled = false;
            btnVerifyOtp.textContent = 'Verify Code';
            showResetMsg('Verification failed: ' + err.message, false);
          });
        });
      }

      // STEP 3: Update Password
      if (btnUpdatePass) {
        btnUpdatePass.addEventListener('click', function() {
          clearResetMsg();
          var pass1 = resetNewPass.value || '';
          var pass2 = resetConfirmPass.value || '';

          if (!pass1 || pass1.length < 6) {
            return showResetMsg('Password must be at least 6 characters long.', false);
          }
          if (pass1 !== pass2) {
            return showResetMsg('Passwords do not match.', false);
          }

          btnUpdatePass.disabled = true;
          btnUpdatePass.textContent = 'Updating Password...';

          window.api.updatePassword(pass1).then(function(res) {
            btnUpdatePass.disabled = false;
            btnUpdatePass.textContent = 'Update Password & Sign In';
            if (res && res.success) {
              if (window.Toast) window.Toast.show('Password updated successfully! Logging in...', 'success');
              resetModal.style.display = 'none';
              emailEl.value = activeResetEmail;
              passEl.value = pass1;
              btnEl.click(); // Auto-login with new password
            } else {
              showResetMsg(res.error || 'Password update failed.', false);
            }
          }).catch(function(err) {
            btnUpdatePass.disabled = false;
            btnUpdatePass.textContent = 'Update Password & Sign In';
            showResetMsg('Update failed: ' + err.message, false);
          });
        });
      }
    }
  }
};
