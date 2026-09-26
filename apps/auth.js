/* ===== WEBZ ACCOUNTS =====
   Students only ever see a username + password. Under the hood,
   Supabase Auth still needs *something* that looks like an email,
   so we generate one deterministically: "username@webz.local".
   Nobody ever sees this, and no email is ever actually sent
   (that's why "Confirm email" must be OFF in the Supabase dashboard).

   Other app files can check WebzAuth.getCurrentUser() and listen
   for "webz:auth-changed" events on window to react to login/logout.
*/

const WebzAuth = (() => {
  const sb = window.WebzSupabase;
  let currentUser = null; // { id, username } or null

  function usernameToFakeEmail(username) {
    return username.trim().toLowerCase() + "@webz.local";
  }

  async function refreshCurrentUser() {
    const { data } = await sb.auth.getSession();
    const session = data.session;
    if (!session) {
      currentUser = null;
    } else {
      const { data: profile } = await sb
        .from("profiles")
        .select("id, username")
        .eq("id", session.user.id)
        .single();
      currentUser = profile ? { id: profile.id, username: profile.username } : null;
    }
    window.dispatchEvent(new CustomEvent("webz:auth-changed", { detail: currentUser }));
    return currentUser;
  }

  async function isUsernameTaken(username) {
    const { data } = await sb
      .from("profiles")
      .select("id")
      .ilike("username", username.trim());
    return data && data.length > 0;
  }

  async function signUp(username, password) {
    username = username.trim();
    if (!username || !password) return { error: "Please fill in both fields." };
    if (username.length < 3) return { error: "Username must be at least 3 characters." };
    if (password.length < 6) return { error: "Password must be at least 6 characters." };

    const taken = await isUsernameTaken(username);
    if (taken) return { error: "That username is already taken." };

    const { data, error } = await sb.auth.signUp({
      email: usernameToFakeEmail(username),
      password,
    });
    if (error) return { error: error.message };

    const { error: profileError } = await sb
      .from("profiles")
      .insert({ id: data.user.id, username });
    if (profileError) return { error: profileError.message };

    await refreshCurrentUser();
    return { success: true };
  }

  async function signIn(username, password) {
    username = username.trim();
    if (!username || !password) return { error: "Please fill in both fields." };

    const { error } = await sb.auth.signInWithPassword({
      email: usernameToFakeEmail(username),
      password,
    });
    if (error) return { error: "Incorrect username or password." };

    await refreshCurrentUser();
    return { success: true };
  }

  async function signOut() {
    await sb.auth.signOut();
    await refreshCurrentUser();
  }

  function getCurrentUser() {
    return currentUser;
  }

  // Load session on startup
  refreshCurrentUser();

  return { signUp, signIn, signOut, getCurrentUser, refreshCurrentUser };
})();

window.WebzApps = window.WebzApps || {};

window.WebzApps.account = {
  title: "Account",
  icon: "👤",
  open() {
    const wrapper = document.createElement("div");
    wrapper.style.fontFamily = "'Tahoma', sans-serif";
    wrapper.style.fontSize = "12px";
    wrapper.style.padding = "10px";

    WebzWM.createWindow({
      title: "Account",
      icon: "👤",
      width: 320,
      height: 260,
      content: wrapper,
      onMount: (body) => renderAccountApp(body),
    });
  },
};

function renderAccountApp(body) {
  function render() {
    const user = WebzAuth.getCurrentUser();
    if (user) {
      body.innerHTML = `
        <div style="text-align:center; padding-top:20px;">
          <div style="font-size:32px;">👤</div>
          <p>Logged in as <b>${escapeHtml(user.username)}</b></p>
          <button id="acc-logout">Log Out</button>
        </div>
      `;
      body.querySelector("#acc-logout").addEventListener("click", async () => {
        await WebzAuth.signOut();
      });
    } else {
      body.innerHTML = `
        <div style="display:flex; gap:4px; margin-bottom:10px;">
          <button id="acc-tab-login" style="flex:1;">Log In</button>
          <button id="acc-tab-signup" style="flex:1;">Sign Up</button>
        </div>
        <div id="acc-form"></div>
        <div id="acc-status" style="color:#a00; font-size:11px; margin-top:8px;"></div>
      `;
      const formEl = body.querySelector("#acc-form");
      const statusEl = body.querySelector("#acc-status");

      function showForm(mode) {
        statusEl.textContent = "";
        formEl.innerHTML = `
          <label style="display:block; margin-bottom:6px;">Username<br>
            <input id="acc-username" type="text" style="width:100%;">
          </label>
          <label style="display:block; margin-bottom:6px;">Password<br>
            <input id="acc-password" type="password" style="width:100%;">
          </label>
          <button id="acc-submit" style="width:100%;">${mode === "signup" ? "Create Account" : "Log In"}</button>
        `;
        formEl.querySelector("#acc-submit").addEventListener("click", async () => {
          const username = formEl.querySelector("#acc-username").value;
          const password = formEl.querySelector("#acc-password").value;
          statusEl.style.color = "#555";
          statusEl.textContent = "Working on it...";
          const result = mode === "signup"
            ? await WebzAuth.signUp(username, password)
            : await WebzAuth.signIn(username, password);
          if (result.error) {
            statusEl.style.color = "#a00";
            statusEl.textContent = result.error;
          }
          // On success, the "webz:auth-changed" event triggers render()
        });
      }

      body.querySelector("#acc-tab-login").addEventListener("click", () => showForm("login"));
      body.querySelector("#acc-tab-signup").addEventListener("click", () => showForm("signup"));
      showForm("login");
    }
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }

  window.addEventListener("webz:auth-changed", render);
  render();
}
