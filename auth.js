/**
 * BookHub shared auth module
 * Handles real Google One Tap login, session persistence, and logout.
 * Include this script on every page AFTER loading the Google Identity script tag.
 *
 * Usage in HTML:
 *   <script src="https://accounts.google.com/gsi/client" async defer></script>
 *   <script src="/auth.js"></script>   (adjust path per page depth)
 *   Then call: BH.Auth.init({ clientId, onStateChange })
 */

const GOOGLE_CLIENT_ID = "239301146552-t0si8iftqsr3hohpf402i6n3unlitab1.apps.googleusercontent.com";
const BACKEND_BASE = ""; // set to your backend URL e.g. "https://bookhub-api.vercel.app" when deployed

window.BH = window.BH || {};

BH.Auth = (() => {
  const ACCOUNT_KEY = "bh_account_v2";
  let _onStateChange = null;

  // ── storage helpers ──────────────────────────────────────────────────────
  function setAccount(user) {
    try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(user)); } catch {}
  }
  function getAccount() {
    try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null"); } catch { return null; }
  }
  function clearAccount() {
    localStorage.removeItem(ACCOUNT_KEY);
  }

  // ── notify listeners ─────────────────────────────────────────────────────
  function notify() {
    if (typeof _onStateChange === "function") _onStateChange(getAccount());
  }

  // ── real Google One Tap callback ─────────────────────────────────────────
  // When Google calls this with a credential (JWT id_token), we:
  // 1. Decode the JWT payload (base64) client-side for the display name/picture.
  // 2. Optionally send the token to the backend to set an httpOnly session cookie.
  function handleGoogleCredential(response) {
    try {
      const idToken = response.credential;
      // Decode JWT payload (no verification here — that's the backend's job)
      const parts = idToken.split(".");
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));

      const user = {
        provider: "google",
        id: payload.sub,
        name: payload.name || payload.email,
        email: payload.email,
        picture: payload.picture || null,
        idToken, // keep for backend verification
      };
      setAccount(user);
      notify();

      // Fire-and-forget to backend (sets httpOnly cookie session)
      if (BACKEND_BASE) {
        fetch(`${BACKEND_BASE}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken }),
        }).catch(() => {}); // non-blocking
      }
    } catch (e) {
      console.error("BH.Auth: failed to parse Google credential", e);
    }
  }

  // ── initialize Google One Tap ────────────────────────────────────────────
  function initGoogleOneTap(clientId) {
    if (!window.google?.accounts?.id) {
      // Google GSI script not yet loaded — retry in 500 ms
      setTimeout(() => initGoogleOneTap(clientId), 500);
      return;
    }
    google.accounts.id.initialize({
      client_id: clientId || GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the Sign In With Google button into #googleSignInBtn if it exists
    const btnEl = document.getElementById("googleSignInBtn");
    if (btnEl) {
      google.accounts.id.renderButton(btnEl, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: btnEl.offsetWidth || 280,
      });
    }
    // Also show One Tap prompt if user is not logged in
    if (!getAccount()) {
      google.accounts.id.prompt();
    }
  }

  // ── logout ───────────────────────────────────────────────────────────────
  function logout() {
    const acct = getAccount();
    clearAccount();

    // Revoke Google session if available
    if (acct?.id && window.google?.accounts?.id) {
      try { google.accounts.id.revoke(acct.id, () => {}); } catch {}
    }

    // Tell backend to clear cookie
    if (BACKEND_BASE) {
      fetch(`${BACKEND_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    }
    notify();
  }

  // ── public init ──────────────────────────────────────────────────────────
  function init({ clientId, onStateChange } = {}) {
    if (onStateChange) _onStateChange = onStateChange;
    initGoogleOneTap(clientId || GOOGLE_CLIENT_ID);
    // Immediately fire with current state so UI can render
    notify();
  }

  return { init, getAccount, setAccount, clearAccount, logout, notify };
})();

// ── Dark mode (shared) ────────────────────────────────────────────────────
BH.Dark = (() => {
  function apply() {
    if (localStorage.getItem("darkMode") === "enabled") document.body.classList.add("dark");
  }
  function toggle() {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "enabled" : "disabled");
    const btn = document.getElementById("darkToggle");
    if (btn) btn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  }
  return { apply, toggle };
})();

// Auto-apply dark mode as early as possible
BH.Dark.apply();
