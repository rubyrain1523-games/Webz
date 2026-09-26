/* ===== WEBZ DESKTOP =====
   Builds desktop icons + start menu from a fixed app list.
   Each app script (in /apps) registers itself onto window.WebzApps
   as: WebzApps.someKey = { title, icon, open: function() {...} }
*/

window.WebzApps = window.WebzApps || {};

const APP_ORDER = [
  "browser",
  "builder",
  "school",
  "notepad",
  "account",
  "minesweeper",
  "snake",
  "solitaire",
];

function buildDesktop() {
  const iconLayer = document.getElementById("desktop-icons");
  const menuItems = document.getElementById("start-menu-items");

  APP_ORDER.forEach((key) => {
    const app = window.WebzApps[key];
    if (!app) return; // app script not loaded yet / missing

    // Desktop icon
    const iconEl = document.createElement("div");
    iconEl.className = "desktop-icon";
    iconEl.tabIndex = 0;
    iconEl.innerHTML = `
      <div class="icon-emoji">${app.icon}</div>
      <div class="icon-label">${app.title}</div>
    `;
    iconEl.addEventListener("dblclick", () => app.open());
    iconEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") app.open();
    });
    iconLayer.appendChild(iconEl);

    // Start menu item
    const menuEl = document.createElement("div");
    menuEl.className = "start-menu-item";
    menuEl.innerHTML = `<span>${app.icon}</span><span>${app.title}</span>`;
    menuEl.addEventListener("click", () => {
      app.open();
      document.getElementById("start-menu").classList.add("hidden");
    });
    menuItems.appendChild(menuEl);
  });
}

function wireStartMenu() {
  const startBtn = document.getElementById("start-btn");
  const startMenu = document.getElementById("start-menu");

  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
      startMenu.classList.add("hidden");
    }
  });
}

function startClock() {
  const clock = document.getElementById("clock");
  function tick() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    clock.textContent = `${h}:${m} ${ampm}`;
  }
  tick();
  setInterval(tick, 1000 * 10);
}

function wireUserBadge() {
  const badge = document.createElement("div");
  badge.id = "user-badge";
  badge.style.marginRight = "6px";
  badge.style.padding = "4px 10px";
  badge.style.fontSize = "12px";
  badge.style.cursor = "pointer";
  badge.title = "Click to open Account";
  badge.addEventListener("click", () => window.WebzApps.account && window.WebzApps.account.open());

  function render() {
    const user = window.WebzAuth ? window.WebzAuth.getCurrentUser() : null;
    badge.textContent = user ? `👤 ${user.username}` : "👤 Not logged in";
  }
  window.addEventListener("webz:auth-changed", render);
  render();

  document.getElementById("taskbar").insertBefore(badge, document.getElementById("clock"));
}

window.addEventListener("DOMContentLoaded", () => {
  buildDesktop();
  wireStartMenu();
  startClock();
  wireUserBadge();
});
