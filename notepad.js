/* ===== NOTEPAD APP ===== */

window.WebzApps = window.WebzApps || {};

window.WebzApps.notepad = {
  title: "Notepad",
  icon: "📝",
  open() {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";

    wrapper.innerHTML = `
      <div style="margin-bottom:6px; display:flex; gap:6px;">
        <button id="np-save">💾 Save</button>
        <span id="np-status" style="align-self:center; color:#555; font-size:11px;"></span>
      </div>
      <textarea id="np-text" style="flex:1; width:100%; resize:none; font-family: 'Courier New', monospace; font-size:13px; padding:6px;"></textarea>
    `;

    WebzWM.createWindow({
      title: "Notepad",
      icon: "📝",
      width: 420,
      height: 320,
      content: wrapper,
      onMount: (body) => {
        const textEl = body.querySelector("#np-text");
        const saveBtn = body.querySelector("#np-save");
        const status = body.querySelector("#np-status");

        textEl.value = localStorage.getItem("webz_notepad_content") || "";

        saveBtn.addEventListener("click", () => {
          localStorage.setItem("webz_notepad_content", textEl.value);
          status.textContent = "Saved!";
          setTimeout(() => (status.textContent = ""), 1500);
        });

        // Autosave on typing (debounced)
        let t;
        textEl.addEventListener("input", () => {
          clearTimeout(t);
          t = setTimeout(() => {
            localStorage.setItem("webz_notepad_content", textEl.value);
          }, 800);
        });
      },
    });
  },
};
