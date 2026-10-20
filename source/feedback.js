(function () {
  'use strict';
  var dlg = document.getElementById('fb');
  var form = document.getElementById('fb-form');
  var statusEl = document.getElementById('fb-status');
  var sendBtn = document.getElementById('fb-send');
  var cancelBtn = document.getElementById('fb-cancel');

  function openDialog() {
    statusEl.textContent = '';
    cancelBtn.textContent = 'Cancel';
    dlg.showModal();
    document.getElementById('fb-message').focus();
  }
  document.getElementById('fb-open').addEventListener('click', openDialog);
  document.getElementById('fb-open-banner').addEventListener('click', openDialog);
  cancelBtn.addEventListener('click', function () { dlg.close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form);
    var message = String(f.get('message') || '').trim();
    if (!message) { statusEl.textContent = 'Please write a few words first.'; return; }
    var cur = document.querySelector('.hdr [aria-current="page"]');
    var payload = {
      message: message,
      clear: String(f.get('clear') || ''),
      role: String(f.get('role') || ''),
      email: String(f.get('email') || '').trim(),
      website: String(f.get('website') || ''),
      page: cur ? cur.textContent : 'Home',
      device: window.innerWidth < 640 ? 'phone' : 'desktop'
    };
    sendBtn.disabled = true;
    statusEl.textContent = 'Sending...';
    fetch('/api/feedback', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) { var err = new Error('status'); err.code = r.status; throw err; }
      form.reset();
      sendBtn.disabled = false;
      cancelBtn.textContent = 'Close';
      statusEl.textContent = 'Thank you. That helps.';
    }).catch(function (err) {
      sendBtn.disabled = false;
      statusEl.textContent = err && err.code === 503
        ? "Feedback isn't switched on yet. Please try again later."
        : "Couldn't send that. Please try again.";
    });
  });
})();
