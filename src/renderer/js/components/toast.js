var Toast = (function() {
  var container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type, duration) {
    var el       = document.createElement('div');
    el.className = 'toast toast-' + (type || 'info');
    el.textContent = message;
    getContainer().appendChild(el);

    setTimeout(function() {
      el.classList.add('toast-fade');
      setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }, duration || 3000);
  }

  return { show: show };
}());
