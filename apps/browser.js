/* ===== WEBZ BROWSER APP =====
   Search for websites published by Webz users.
   Visiting a site opens it in a SANDBOXED iframe (no allow-same-origin),
   so a user's HTML/JS can never reach Webz's own data, localStorage,
   or other users' info. This is the security model in action early.
*/

window.WebzApps = window.WebzApps || {};

window.WebzApps.browser = {
  title: "Webz Browser",
  icon: "🌐",
  open() {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.fontFamily = "'Tahoma', sans-serif";

    wrapper.innerHTML = `
      <div style="display:flex; gap:6px; margin-bottom:10px;">
        <span style="align-self:center;">🔍</span>
        <input id="wb-search" type="text" placeholder="Search Webz..." 
          style="flex:1; padding:5px; border:2px inset #808080; font-size:13px;">
        <button id="wb-go">Go</button>
      </div>
      <div id="wb-results" style="flex:1; overflow-y:auto;"></div>
    `;

    WebzWM.createWindow({
      title: "Webz Browser",
      icon: "🌐",
      width: 560,
      height: 420,
      content: wrapper,
      onMount: (body) => {
        const searchInput = body.querySelector("#wb-search");
        const goBtn = body.querySelector("#wb-go");
        const resultsEl = body.querySelector("#wb-results");

        function showHome() {
          resultsEl.innerHTML = `
            <div style="text-align:center; padding-top:30px;">
              <div style="font-size:40px;">🌐</div>
              <h2 style="margin:8px 0;">Welcome to Webz!</h2>
              <p style="color:#555; font-size:12px;">
                Search for websites made by other Webz users.<br>
                Try searching: <b>awesome</b>, <b>games</b>, or a username.
              </p>
            </div>
          `;
        }

        function renderResults(query, results) {
          if (results.length === 0) {
            resultsEl.innerHTML = `
              <p style="text-align:center; color:#555; padding-top:30px;">
                No websites found for "<b>${escapeHtml(query)}</b>".<br>
                Try a different search, or make your own in the Web Builder!
              </p>
            `;
            return;
          }

          resultsEl.innerHTML = `<p style="font-size:11px; color:#555; margin-bottom:8px;">${results.length} result(s) for "${escapeHtml(query)}"</p>`;

          results.forEach((site) => {
            const card = document.createElement("div");
            card.style.border = "1px solid #a0a0a0";
            card.style.background = "#f4f4f4";
            card.style.padding = "10px";
            card.style.marginBottom = "8px";
            card.innerHTML = `
              <div style="font-weight:bold; font-size:14px; color:#000080;">🌐 ${escapeHtml(site.name)}</div>
              <div style="font-size:11px; color:#555; margin:2px 0;">by ${escapeHtml(site.creator)}</div>
              <div style="font-size:12px; margin-bottom:6px;">${escapeHtml(site.description)}</div>
              <button class="wb-visit" data-id="${site.id}">Visit ➜</button>
            `;
            resultsEl.appendChild(card);
          });

          resultsEl.querySelectorAll(".wb-visit").forEach((btn) => {
            btn.addEventListener("click", () => {
              visitSite(btn.dataset.id);
            });
          });
        }

        function escapeHtml(str) {
          const div = document.createElement("div");
          div.textContent = str;
          return div.innerHTML;
        }

        function doSearch() {
          const q = searchInput.value;
          if (!q.trim()) {
            showHome();
            return;
          }
          resultsEl.innerHTML = `<p style="text-align:center; padding-top:30px; color:#555;">Searching...</p>`;
          WebzSites.search(q).then((results) => {
            renderResults(q, results);
          });
        }

        goBtn.addEventListener("click", doSearch);
        searchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") doSearch();
        });

        showHome();
      },
    });
  },
};

/* Opens a published site in its own sandboxed window.
   sandbox="allow-scripts" WITHOUT "allow-same-origin" means:
   the site's code runs, but it cannot read Webz's cookies/localStorage,
   cannot see other windows, and is treated as coming from a
   completely different, opaque origin. This is the core of the
   "user sites can't touch real Webz data" security promise. */
async function visitSite(id) {
  const site = await WebzSites.getById(id);
  if (!site) return;

  const iframe = document.createElement("iframe");
  iframe.sandbox = "allow-scripts";
iframe.style.width = "100%";
iframe.style.height = "100%";
iframe.style.minWidth = "0";
iframe.style.minHeight = "0";
iframe.style.border = "none";
iframe.style.display = "block";
iframe.srcdoc = site.html;

WebzWM.createWindow({
  title: site.name,
  icon: "🌐",
  width: 700,
  height: 500,
  content: iframe,
});
}
