// shared.js — runs on every page

// ── Theme initialisation ────────────────────────────────────
// Light mode is the default; dark mode is opt-in via settings.
(function applyTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }
})();

// ── Subscription gate ───────────────────────────────────────
// Subscription checks have been removed for the patient portal.

// ── Toast utility ──────────────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.getElementById('toastMessage');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.style.borderColor = type === 'success' ? 'var(--success)' : 'var(--primary)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ── Sign Out button ────────────────────────────────────────
document.querySelectorAll('.sign-out').forEach(btn => {
  btn.addEventListener('click', () => {
    showToast('You have been signed out. Redirecting…');
    setTimeout(() => window.location.href = 'login.html', 1800);
  });
});

function initNoPastDates() {
  if (typeof DentalSync !== 'undefined' && DentalSync.applyNoPastDateInputs) {
    DentalSync.applyNoPastDateInputs();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNoPastDates);
} else {
  initNoPastDates();
}

// ── Search (demo) ──────────────────────────────────────────
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      showToast(`Searching for "${searchInput.value.trim()}"…`);
    }
  });
}

// ── Notification drawer (open notifications inline) ─────────────────
function closeNotificationDrawer(drawer) {
  if (!drawer) return;
  drawer.classList.add('hidden');
  setTimeout(() => drawer.remove(), 220);
}

function showNotificationDrawer(htmlContent) {
  // remove existing
  const existing = document.querySelector('.notif-drawer');
  if (existing) existing.remove();

  const d = document.createElement('div');
  d.className = 'notif-drawer';
  d.innerHTML = `
    <div class="notif-header">
      <strong>Notifications</strong>
      <button class="close-btn" aria-label="Close">✕</button>
    </div>
    <div class="notif-list">${htmlContent || '<div class="notif-empty">No notifications.</div>'}</div>
  `;

  document.body.appendChild(d);
  d.querySelector('.close-btn').addEventListener('click', () => closeNotificationDrawer(d));

  // close on outside click
  setTimeout(() => {
    const outsideHandler = (ev) => {
      if (!d.contains(ev.target)) {
        closeNotificationDrawer(d);
        document.removeEventListener('click', outsideHandler);
      }
    };
    document.addEventListener('click', outsideHandler);
  }, 100);
}

// wire bell icon to open notifications inline
(function initNotificationDrawer() {
  const candidates = Array.from(document.querySelectorAll('.icon-btn'));
  candidates.forEach(btn => {
    const text = (btn.textContent || '').trim();
    const title = (btn.getAttribute('title') || '').toLowerCase();
    if (text.includes('🔔') || title.includes('notif') || btn.querySelector('.dot')) {
      btn.addEventListener('click', (e) => {
        // if it's an anchor, prevent default navigation
        if (e.target.closest('a') || btn.tagName.toLowerCase() === 'a') e.preventDefault();
        const href = btn.getAttribute('href') || (btn.closest && btn.closest('a') && btn.closest('a').getAttribute('href')) || 'messages.html';
        fetch(href).then(res => {
          if (!res.ok) throw new Error('network');
          return res.text();
        }).then(text => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          // prefer specific sections
          const threads = doc.querySelector('#messageThreadsList');
          const syncList = doc.querySelector('#syncNotificationsList');
          const heading = doc.querySelector('.page-heading');
          const content = (heading ? heading.outerHTML : '') + (threads ? threads.outerHTML : '') + (syncList ? syncList.outerHTML : '');
          showNotificationDrawer(content);
        }).catch(() => {
          // fallback to full page navigation
          window.location.href = href;
        });
      });
    }
  });
})();
