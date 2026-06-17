var Modal = (function() {
  function show(message, buttons) {
    var overlay    = document.createElement('div');
    overlay.className = 'modal-overlay';
    var box        = document.createElement('div');
    box.className  = 'modal-box';
    var msg        = document.createElement('p');
    msg.textContent = message;
    box.appendChild(msg);

    for (var i = 0; i < buttons.length; i++) {
      (function(btn) {
        var el = document.createElement('button');
        el.className   = btn.cls || 'btn';
        el.textContent = btn.label;
        el.onclick     = function() {
          document.body.removeChild(overlay);
          if (btn.action) btn.action();
        };
        box.appendChild(el);
        box.appendChild(document.createTextNode(' '));
      }(buttons[i]));
    }

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function confirm(message, onYes, onNo) {
    show(message, [
      { label: 'Yes, Delete', cls: 'btn btn-danger', action: onYes },
      { label: 'Cancel',      cls: 'btn',            action: onNo  }
    ]);
  }

  function alert(message, onOk) {
    show(message, [
      { label: 'OK', cls: 'btn btn-primary', action: onOk }
    ]);
  }

  return { confirm: confirm, alert: alert };
}());
