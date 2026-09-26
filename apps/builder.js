/* ===== WEB BUILDER APP =====
   Two modes:
   - Code Mode: write raw HTML, see a live sandboxed preview.
   - Block Mode: assemble simple blocks (heading, paragraph, image, etc),
     which get turned into real HTML. Block -> HTML only, one direction,
     on purpose (per the design spec: don't try to reverse-parse HTML).

   Publishing writes the final HTML into WebzSites (js/sites-store.js),
   which is what the Webz Browser searches.
*/

window.WebzApps = window.WebzApps || {};

window.WebzApps.builder = {
  title: "Web Builder",
  icon: "🧑‍💻",
  open() {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.fontFamily = "'Tahoma', sans-serif";
    wrapper.style.fontSize = "12px";

    wrapper.innerHTML = `
      <div style="display:flex; gap:6px; margin-bottom:8px;">
        <button id="wbld-mode-code" class="wbld-mode-btn">🧾 Code Mode</button>
        <button id="wbld-mode-block" class="wbld-mode-btn">🧱 Block Mode</button>
        <div style="flex:1;"></div>
        <button id="wbld-publish" style="font-weight:bold;">🚀 Publish to Webz</button>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap; align-items:center;">
        <label>Site name:
          <input id="wbld-name" type="text" placeholder="My Awesome Homepage" style="width:150px;">
        </label>
        <label style="flex:1; min-width:200px;">Description:
          <input id="wbld-desc" type="text" placeholder="A short description of your site" style="width:100%;">
        </label>
        <span id="wbld-account-status" style="font-size:11px; color:#555;"></span>
      </div>

      <div id="wbld-code-panel" style="flex:1; display:flex; gap:8px; min-height:0;">
        <textarea id="wbld-code" spellcheck="false" style="flex:1; font-family:'Courier New',monospace; font-size:12px; resize:none; padding:6px;"></textarea>
        <iframe id="wbld-code-preview" sandbox="allow-scripts" style="flex:1; border:2px inset #808080; background:white;"></iframe>
      </div>

      <div id="wbld-block-panel" style="flex:1; display:none; gap:8px; min-height:0;">
        <div style="width:150px; display:flex; flex-direction:column; gap:4px; overflow-y:auto;">
          <div style="font-weight:bold; margin-bottom:2px;">Add block:</div>
          <button class="wbld-add-block" data-type="heading">Heading</button>
          <button class="wbld-add-block" data-type="paragraph">Paragraph</button>
          <button class="wbld-add-block" data-type="image">Image</button>
          <button class="wbld-add-block" data-type="button">Button</button>
          <button class="wbld-add-block" data-type="link">Link</button>
          <button class="wbld-add-block" data-type="list">List</button>
          <button class="wbld-add-block" data-type="divider">Divider</button>
          <button class="wbld-add-block" data-type="container">Container</button>
          <button class="wbld-add-block" data-type="spacer">Spacer</button>
        </div>
        <div id="wbld-block-list" style="width:260px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;"></div>
        <iframe id="wbld-block-preview" sandbox="allow-scripts" style="flex:1; border:2px inset #808080; background:white;"></iframe>
      </div>

      <div id="wbld-status" style="font-size:11px; color:#555; margin-top:6px; min-height:14px;"></div>
    `;

    WebzWM.createWindow({
      title: "Web Builder",
      icon: "🧑‍💻",
      width: 780,
      height: 520,
      content: wrapper,
      onMount: (body) => initBuilder(body),
    });
  },
};

function initBuilder(body) {
  const codeBtn = body.querySelector("#wbld-mode-code");
  const blockBtn = body.querySelector("#wbld-mode-block");
  const codePanel = body.querySelector("#wbld-code-panel");
  const blockPanel = body.querySelector("#wbld-block-panel");
  const codeTextarea = body.querySelector("#wbld-code");
  const codePreview = body.querySelector("#wbld-code-preview");
  const blockList = body.querySelector("#wbld-block-list");
  const blockPreview = body.querySelector("#wbld-block-preview");
  const nameInput = body.querySelector("#wbld-name");
  const descInput = body.querySelector("#wbld-desc");
  const accountStatusEl = body.querySelector("#wbld-account-status");
  const publishBtn = body.querySelector("#wbld-publish");
  const statusEl = body.querySelector("#wbld-status");

  let mode = "code";
  let blocks = [];
  let blockIdCounter = 0;

  // ---- Load draft from localStorage ----
  const draft = JSON.parse(localStorage.getItem("webz_builder_draft") || "null");
  if (draft) {
    nameInput.value = draft.name || "";
    descInput.value = draft.desc || "";
    codeTextarea.value = draft.code || defaultStarterHtml();
    blocks = draft.blocks || [];
    blockIdCounter = draft.blockIdCounter || 0;
  } else {
    codeTextarea.value = defaultStarterHtml();
  }

  function defaultStarterHtml() {
    return `<h1>Welcome to my website!</h1>\n<p>This is my little corner of Webz.</p>\n<button>Click Me</button>`;
  }

  function saveDraft() {
    localStorage.setItem(
      "webz_builder_draft",
      JSON.stringify({
        name: nameInput.value,
        desc: descInput.value,
        code: codeTextarea.value,
        blocks,
        blockIdCounter,
      })
    );
  }

  // ---- Account status ----
  function renderAccountStatus() {
    const user = WebzAuth.getCurrentUser();
    if (user) {
      accountStatusEl.textContent = `Publishing as: ${user.username}`;
      accountStatusEl.style.color = "#060";
    } else {
      accountStatusEl.textContent = "⚠️ Not logged in — open Account to log in before publishing.";
      accountStatusEl.style.color = "#a00";
    }
  }
  window.addEventListener("webz:auth-changed", renderAccountStatus);
  renderAccountStatus();

  // ---- Mode switching ----
  function setMode(newMode) {
    mode = newMode;
    codePanel.style.display = mode === "code" ? "flex" : "none";
    blockPanel.style.display = mode === "block" ? "flex" : "none";
    codeBtn.style.fontWeight = mode === "code" ? "bold" : "normal";
    blockBtn.style.fontWeight = mode === "block" ? "bold" : "normal";
    if (mode === "code") updateCodePreview();
    if (mode === "block") { renderBlockList(); updateBlockPreview(); }
  }
  codeBtn.addEventListener("click", () => setMode("code"));
  blockBtn.addEventListener("click", () => setMode("block"));

  // ---- Code mode preview ----
  let codeDebounce;
  codeTextarea.addEventListener("input", () => {
    clearTimeout(codeDebounce);
    codeDebounce = setTimeout(() => {
      updateCodePreview();
      saveDraft();
    }, 400);
  });
  function updateCodePreview() {
    codePreview.srcdoc = codeTextarea.value;
  }

  // ---- Block mode ----
  function blockToHtml(b) {
    switch (b.type) {
      case "heading": {
        const tag = b.size === "Large" ? "h1" : b.size === "Medium" ? "h2" : "h3";
        return `<${tag}>${escapeHtml(b.text)}</${tag}>`;
      }
      case "paragraph":
        return `<p>${escapeHtml(b.text)}</p>`;
      case "image":
        return `<img src="${escapeAttr(b.src)}" alt="${escapeAttr(b.alt)}" style="max-width:100%;">`;
      case "button":
        return `<button onclick="${b.link ? `window.location.href='${escapeAttr(b.link)}'` : ""}">${escapeHtml(b.text)}</button>`;
      case "link":
        return `<a href="${escapeAttr(b.href)}">${escapeHtml(b.text)}</a>`;
      case "list": {
        const tag = b.ordered ? "ol" : "ul";
        const items = (b.items || "").split("\n").filter((x) => x.trim()).map((x) => `<li>${escapeHtml(x)}</li>`).join("");
        return `<${tag}>${items}</${tag}>`;
      }
      case "divider":
        return `<hr>`;
      case "container":
        return `<div style="background:${escapeAttr(b.bg || "#f0f0f0")}; padding:16px; border:1px solid #ccc;">${escapeHtml(b.text || "")}</div>`;
      case "spacer":
        return `<div style="height:${parseInt(b.height, 10) || 20}px;"></div>`;
      default:
        return "";
    }
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }
  function escapeAttr(str) {
    return (str || "").replace(/"/g, "&quot;");
  }

  function defaultFieldsFor(type) {
    switch (type) {
      case "heading": return { text: "Heading text", size: "Large" };
      case "paragraph": return { text: "Some paragraph text." };
      case "image": return { src: "https://via.placeholder.com/200x120", alt: "description" };
      case "button": return { text: "Click Me", link: "" };
      case "link": return { text: "Click here", href: "https://example.com" };
      case "list": return { items: "First item\nSecond item", ordered: false };
      case "divider": return {};
      case "container": return { text: "Container content", bg: "#f0f0f0" };
      case "spacer": return { height: 20 };
      default: return {};
    }
  }

  function addBlock(type) {
    blockIdCounter++;
    blocks.push({ id: "b" + blockIdCounter, type, ...defaultFieldsFor(type) });
    renderBlockList();
    updateBlockPreview();
    saveDraft();
  }

  body.querySelectorAll(".wbld-add-block").forEach((btn) => {
    btn.addEventListener("click", () => addBlock(btn.dataset.type));
  });

  function fieldRow(labelText, inputEl) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexDirection = "column";
    row.style.fontSize = "11px";
    const label = document.createElement("label");
    label.textContent = labelText;
    row.appendChild(label);
    row.appendChild(inputEl);
    return row;
  }

  function renderBlockList() {
    blockList.innerHTML = "";
    blocks.forEach((b, idx) => {
      const card = document.createElement("div");
      card.style.border = "1px solid #999";
      card.style.background = "#eee";
      card.style.padding = "6px";

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.fontWeight = "bold";
      header.style.marginBottom = "4px";
      header.innerHTML = `<span>${b.type}</span>`;

      const controls = document.createElement("div");
      const upBtn = document.createElement("button");
      upBtn.textContent = "↑";
      upBtn.style.marginRight = "2px";
      upBtn.addEventListener("click", () => {
        if (idx > 0) {
          [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
          renderBlockList(); updateBlockPreview(); saveDraft();
        }
      });
      const downBtn = document.createElement("button");
      downBtn.textContent = "↓";
      downBtn.style.marginRight = "2px";
      downBtn.addEventListener("click", () => {
        if (idx < blocks.length - 1) {
          [blocks[idx + 1], blocks[idx]] = [blocks[idx], blocks[idx + 1]];
          renderBlockList(); updateBlockPreview(); saveDraft();
        }
      });
      const delBtn = document.createElement("button");
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", () => {
        blocks.splice(idx, 1);
        renderBlockList(); updateBlockPreview(); saveDraft();
      });
      controls.appendChild(upBtn);
      controls.appendChild(downBtn);
      controls.appendChild(delBtn);
      header.appendChild(controls);
      card.appendChild(header);

      // Fields per block type
      const fieldsWrap = document.createElement("div");
      fieldsWrap.style.display = "flex";
      fieldsWrap.style.flexDirection = "column";
      fieldsWrap.style.gap = "4px";

      function onChange() { updateBlockPreview(); saveDraft(); }

      if (b.type === "heading") {
        const textInput = document.createElement("input");
        textInput.value = b.text;
        textInput.addEventListener("input", () => { b.text = textInput.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Text", textInput));

        const sizeSelect = document.createElement("select");
        ["Large", "Medium", "Small"].forEach((s) => {
          const opt = document.createElement("option");
          opt.value = s; opt.textContent = s;
          if (b.size === s) opt.selected = true;
          sizeSelect.appendChild(opt);
        });
        sizeSelect.addEventListener("change", () => { b.size = sizeSelect.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Size", sizeSelect));
      } else if (b.type === "paragraph") {
        const ta = document.createElement("textarea");
        ta.value = b.text;
        ta.rows = 3;
        ta.addEventListener("input", () => { b.text = ta.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Text", ta));
      } else if (b.type === "image") {
        const srcInput = document.createElement("input");
        srcInput.value = b.src;
        srcInput.addEventListener("input", () => { b.src = srcInput.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Image URL", srcInput));
        const altInput = document.createElement("input");
        altInput.value = b.alt;
        altInput.addEventListener("input", () => { b.alt = altInput.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Alt text", altInput));
      } else if (b.type === "button") {
        const textInput = document.createElement("input");
        textInput.value = b.text;
        textInput.addEventListener("input", () => { b.text = textInput.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Button text", textInput));
        const linkInput = document.createElement("input");
        linkInput.value = b.link;
        linkInput.placeholder = "optional URL";
        linkInput.addEventListener("input", () => { b.link = linkInput.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Link (optional)", linkInput));
      } else if (b.type === "link") {
        const textInput = document.createElement("input");
        textInput.value = b.text;
        textInput.addEventListener("input", () => { b.text = textInput.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Link text", textInput));
        const hrefInput = document.createElement("input");
        hrefInput.value = b.href;
        hrefInput.addEventListener("input", () => { b.href = hrefInput.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("URL", hrefInput));
      } else if (b.type === "list") {
        const ta = document.createElement("textarea");
        ta.value = b.items;
        ta.rows = 3;
        ta.placeholder = "One item per line";
        ta.addEventListener("input", () => { b.items = ta.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Items (one per line)", ta));

        const orderedCheck = document.createElement("input");
        orderedCheck.type = "checkbox";
        orderedCheck.checked = b.ordered;
        orderedCheck.addEventListener("change", () => { b.ordered = orderedCheck.checked; onChange(); });
        const orderedLabel = document.createElement("label");
        orderedLabel.style.fontSize = "11px";
        orderedLabel.appendChild(orderedCheck);
        orderedLabel.append(" Numbered list");
        fieldsWrap.appendChild(orderedLabel);
      } else if (b.type === "container") {
        const ta = document.createElement("textarea");
        ta.value = b.text;
        ta.rows = 2;
        ta.addEventListener("input", () => { b.text = ta.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Content", ta));
        const bgInput = document.createElement("input");
        bgInput.type = "color";
        bgInput.value = toHexColor(b.bg);
        bgInput.addEventListener("input", () => { b.bg = bgInput.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Background color", bgInput));
      } else if (b.type === "spacer") {
        const heightInput = document.createElement("input");
        heightInput.type = "number";
        heightInput.value = b.height;
        heightInput.addEventListener("input", () => { b.height = heightInput.value; onChange(); });
        fieldsWrap.appendChild(fieldRow("Height (px)", heightInput));
      }
      // divider has no fields

      card.appendChild(fieldsWrap);
      blockList.appendChild(card);
    });
  }

  function toHexColor(val) {
    if (!val || !val.startsWith("#")) return "#f0f0f0";
    return val;
  }

  function generateHtmlFromBlocks() {
    return blocks.map(blockToHtml).join("\n");
  }

  function updateBlockPreview() {
    blockPreview.srcdoc = generateHtmlFromBlocks();
  }

  // ---- Publish ----
  publishBtn.addEventListener("click", async () => {
    const user = WebzAuth.getCurrentUser();
    if (!user) {
      statusEl.textContent = "⚠️ You need to log in (open the Account app) before publishing.";
      statusEl.style.color = "#a00";
      return;
    }

    const name = nameInput.value.trim();
    const desc = descInput.value.trim();

    if (!name || !desc) {
      statusEl.textContent = "⚠️ Please fill in a site name and description before publishing.";
      statusEl.style.color = "#a00";
      return;
    }

    const html = mode === "code" ? codeTextarea.value : generateHtmlFromBlocks();

    statusEl.textContent = "Publishing...";
    statusEl.style.color = "#555";

    const result = await WebzSites.addSite({
      name,
      description: desc,
      html,
      published: true,
    });

    if (result.error) {
      statusEl.textContent = "❌ " + result.error;
      statusEl.style.color = "#a00";
      return;
    }

    statusEl.textContent = `✅ Published "${name}"! Open the Webz Browser and search for it.`;
    statusEl.style.color = "#060";
    saveDraft();
  });

  // Initial render
  setMode("code");
}
