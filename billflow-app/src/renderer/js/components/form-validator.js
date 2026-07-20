/**
 * BillFlow Form Validator
 * Reusable validation utility for Indian business forms
 */
window.FormValidator = (function() {

  // ── Regex Patterns ────────────────────────────────────────────────────────
  var PATTERNS = {
    // GSTIN: 2-digit state code + 10-char PAN + 1 entity code + Z + 1 checksum
    GSTIN:   /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    // PAN: 5 alpha + 4 digits + 1 alpha
    PAN:     /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    // Indian phone: 10 digits starting with 6-9 (optional +91 or 91 prefix)
    PHONE:   /^(?:\+?91[\-\s]?)?[6-9]\d{9}$/,
    // Email: basic RFC-like check
    EMAIL:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // PIN code: exactly 6 digits
    PIN:     /^[1-9][0-9]{5}$/,
    // IFSC: 4 alpha + 0 + 6 alphanumeric
    IFSC:    /^[A-Z]{4}0[A-Z0-9]{6}$/,
    // UPI ID: basic format
    UPI:     /^[\w.\-]+@[\w]+$/
  };

  // ── Validators ────────────────────────────────────────────────────────────

  function validateGSTIN(value) {
    if (!value || !value.trim()) return { valid: true, value: '' }; // optional
    var v = value.trim().toUpperCase();
    if (!PATTERNS.GSTIN.test(v)) {
      return { valid: false, value: v, error: 'Invalid GSTIN format. Expected: 27AAAAA0000A1Z5' };
    }
    return { valid: true, value: v };
  }

  function validatePAN(value) {
    if (!value || !value.trim()) return { valid: true, value: '' };
    var v = value.trim().toUpperCase();
    if (!PATTERNS.PAN.test(v)) {
      return { valid: false, value: v, error: 'Invalid PAN format. Expected: ABCDE1234F' };
    }
    return { valid: true, value: v };
  }

  function validatePhone(value) {
    if (!value || !value.trim()) return { valid: true, value: '' };
    var v = value.trim().replace(/[\s\-()]/g, '');
    if (!PATTERNS.PHONE.test(v)) {
      return { valid: false, value: v, error: 'Invalid phone number. Expected: 10-digit Indian mobile (e.g. 9876543210)' };
    }
    return { valid: true, value: v };
  }

  function validateEmail(value) {
    if (!value || !value.trim()) return { valid: true, value: '' };
    var v = value.trim().toLowerCase();
    if (!PATTERNS.EMAIL.test(v)) {
      return { valid: false, value: v, error: 'Invalid email address format' };
    }
    return { valid: true, value: v };
  }

  function validatePIN(value) {
    if (!value || !value.trim()) return { valid: true, value: '' };
    var v = value.trim();
    if (!PATTERNS.PIN.test(v)) {
      return { valid: false, value: v, error: 'Invalid PIN code. Expected: 6-digit code (e.g. 400001)' };
    }
    return { valid: true, value: v };
  }

  function validateIFSC(value) {
    if (!value || !value.trim()) return { valid: true, value: '' };
    var v = value.trim().toUpperCase();
    if (!PATTERNS.IFSC.test(v)) {
      return { valid: false, value: v, error: 'Invalid IFSC code. Expected: HDFC0000001' };
    }
    return { valid: true, value: v };
  }

  function validateAmount(value) {
    if (value === '' || value === null || value === undefined) return { valid: true, value: 0 };
    var num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, value: value, error: 'Must be a valid number' };
    }
    if (num < 0) {
      return { valid: false, value: value, error: 'Amount cannot be negative' };
    }
    return { valid: true, value: Math.round(num * 100) / 100 };
  }

  function validateRequired(value, fieldName) {
    if (!value || !String(value).trim()) {
      return { valid: false, value: '', error: (fieldName || 'This field') + ' is required' };
    }
    return { valid: true, value: String(value).trim() };
  }

  function validateUPI(value) {
    if (!value || !value.trim()) return { valid: true, value: '' };
    var v = value.trim();
    if (!PATTERNS.UPI.test(v)) {
      return { valid: false, value: v, error: 'Invalid UPI ID format. Expected: name@bank' };
    }
    return { valid: true, value: v };
  }

  // ── UI Helpers ────────────────────────────────────────────────────────────

  /**
   * Show an inline validation error below a field.
   * Creates a small error span if it doesn't exist yet.
   */
  function showFieldError(inputEl, message) {
    if (!inputEl) return;
    inputEl.style.borderColor = 'var(--color-danger)';
    inputEl.style.boxShadow = '0 0 0 3px rgba(139, 58, 58, 0.12)';

    var errorId = inputEl.id + '-validation-error';
    var errorEl = document.getElementById(errorId);
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.id = errorId;
      errorEl.style.cssText = 'color: var(--color-danger); font-size: 11px; margin-top: 4px; font-weight: 500;';
      inputEl.parentNode.appendChild(errorEl);
    }
    errorEl.textContent = '⚠ ' + message;
    errorEl.style.display = 'block';
  }

  /**
   * Clear the inline validation error for a field.
   */
  function clearFieldError(inputEl) {
    if (!inputEl) return;
    inputEl.style.borderColor = '';
    inputEl.style.boxShadow = '';

    var errorId = inputEl.id + '-validation-error';
    var errorEl = document.getElementById(errorId);
    if (errorEl) { errorEl.style.display = 'none'; }
  }

  /**
   * Validate a field and show/clear error inline.
   * @param {HTMLElement} inputEl - The input element
   * @param {string} type - Validation type: 'gstin', 'pan', 'phone', 'email', 'pin', 'ifsc', 'amount', 'upi'
   * @returns {object} - { valid: boolean, value: string, error?: string }
   */
  function validateField(inputEl, type) {
    if (!inputEl) return { valid: true, value: '' };

    var value = inputEl.value;
    var result;

    switch (type) {
      case 'gstin':    result = validateGSTIN(value);    break;
      case 'pan':      result = validatePAN(value);      break;
      case 'phone':    result = validatePhone(value);    break;
      case 'email':    result = validateEmail(value);    break;
      case 'pin':      result = validatePIN(value);      break;
      case 'ifsc':     result = validateIFSC(value);     break;
      case 'amount':   result = validateAmount(value);   break;
      case 'upi':      result = validateUPI(value);      break;
      case 'required': result = validateRequired(value); break;
      default:         result = { valid: true, value: value };
    }

    if (result.valid) {
      clearFieldError(inputEl);
    } else {
      showFieldError(inputEl, result.error);
    }

    return result;
  }

  /**
   * Attach live validation to a field (validates on blur).
   * @param {string} inputId - The ID of the input element
   * @param {string} type - Validation type
   */
  function attachLiveValidation(inputId, type) {
    var el = document.getElementById(inputId);
    if (!el) return;

    el.addEventListener('blur', function() {
      validateField(el, type);
    });

    // Clear error when user starts typing again
    el.addEventListener('input', function() {
      clearFieldError(el);
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    validateGSTIN:    validateGSTIN,
    validatePAN:      validatePAN,
    validatePhone:    validatePhone,
    validateEmail:    validateEmail,
    validatePIN:      validatePIN,
    validateIFSC:     validateIFSC,
    validateAmount:   validateAmount,
    validateRequired: validateRequired,
    validateUPI:      validateUPI,
    validateField:    validateField,
    showFieldError:   showFieldError,
    clearFieldError:  clearFieldError,
    attachLiveValidation: attachLiveValidation,
    PATTERNS: PATTERNS
  };
})();
