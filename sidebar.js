/**
 * sidebar.js — shared sidebar auth rendering
 * Renders user avatar, name, login/logout buttons in every sidebar.
 * Requires auth.js to be loaded first.
 *
 * Expected sidebar HTML structure (injected by each page):
 *   <div class="sidebar-bottom" id="sidebarBottom"></div>
 */

BH.Sidebar = (() => {
  function render(user) {
    const el = document.getElementById("sidebarBottom");
    if (!el) return;

    if (user) {
      const initials = (user.name || "U").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
      el.innerHTML = `
        <div class="sidebar-user">
          ${user.picture
            ? `<img class="sidebar-avatar" src="${user.picture}" alt="${user.name}" referrerpolicy="no-referrer" />`
            : `<div class="sidebar-avatar">${initials}</div>`}
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name || "User"}</div>
            <div class="sidebar-user-email">${user.email || ""}</div>
          </div>
        </div>
        <button class="sidebar-logout-btn" id="sidebarLogoutBtn" type="button">
          <span>⎋</span> Logout
        </button>
      `;
      document.getElementById("sidebarLogoutBtn")?.addEventListener("click", () => {
        BH.Auth.logout();
      });
    } else {
      el.innerHTML = `
        <button class="sidebar-login-btn" id="sidebarLoginBtn" type="button">
          <span>🔑</span> Sign In with Google
        </button>
      `;
      document.getElementById("sidebarLoginBtn")?.addEventListener("click", () => {
        const modal = document.getElementById("authModal");
        if (modal) {
          modal.classList.remove("hidden");
          modal.setAttribute("aria-hidden", "false");
        }
      });
    }
  }

  function init() {
    BH.Auth.init({
      onStateChange: (user) => {
        render(user);
        // also close auth modal if open
        if (user) {
          const modal = document.getElementById("authModal");
          if (modal) {
            modal.classList.add("hidden");
            modal.setAttribute("aria-hidden", "true");
          }
          BH.Toast.show(`Welcome, ${user.name}! 👋`, "success");
        }
      }
    });
  }

  return { init, render };
})();

// ── Toast helper ──────────────────────────────────────────────────────────
BH.Toast = (() => {
  function ensureContainer() {
    let c = document.getElementById("toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "toast-container";
      document.body.appendChild(c);
    }
    return c;
  }
  function show(msg, type = "") {
    const c = ensureContainer();
    const t = document.createElement("div");
    t.className = `toast${type ? " " + type : ""}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3400);
  }
  return { show };
})();
