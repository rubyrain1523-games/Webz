/* ===== WEBZ WINDOW MANAGER =====
   Simple, dependency-free window system.
   Other app scripts call WebzWM.createWindow({...}) to open a window.
*/

const WebzWM = (() => {
  let zCounter = 100;
  let winCounter = 0;
  const windows = new Map(); // id -> { el, taskbarEl }

  function getLayer() {
    return document.getElementById("window-layer");
  }

  function focusWindow(id) {
    windows.forEach((w, wid) => {
      const isTarget = wid === id;
      w.el.classList.toggle("focused", isTarget);
      w.taskbarEl.classList.toggle("active", isTarget);
      if (isTarget) {
        zCounter += 1;
        w.el.style.zIndex = zCounter;
      }
    });
  }

  function closeWindow(id) {
    const w = windows.get(id);
    if (!w) return;
    if (w.onClose) w.onClose();
    w.el.remove();
    w.taskbarEl.remove();
    windows.delete(id);
  }

  function toggleMinimize(id) {
    const w = windows.get(id);
    if (!w) return;
    w.el.classList.toggle("hidden-window");
    if (!w.el.classList.contains("hidden-window")) {
      focusWindow(id);
    }
  }

  function toggleMaximize(id) {
    const w = windows.get(id);
    if (!w) return;
    w.el.classList.toggle("maximized");
  }

  function makeDraggable(el, handle) {
    let startX, startY, startLeft, startTop, dragging = false;

    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest(".window-controls")) return;
      if (el.classList.contains("maximized")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      const deskRect = document.getElementById("desktop").getBoundingClientRect();
      startLeft = rect.left - deskRect.left;
      startTop = rect.top - deskRect.top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = Math.max(0, startLeft + dx) + "px";
      el.style.top = Math.max(0, startTop + dy) + "px";
    });

    document.addEventListener("mouseup", () => { dragging = false; });
  }

  /**
   * createWindow({
   *   title: string,
   *   icon: emoji string,
   *   width, height: numbers (px),
   *   content: HTMLElement or HTML string,
   *   onClose: optional function,
   *   onMount: optional function(bodyEl) called after content is inserted
   * })
   */
  function createWindow(opts) {
    winCounter += 1;
    const id = "win-" + winCounter;

    const el = document.createElement("div");
    el.className = "window";
    el.style.width = (opts.width || 480) + "px";
    el.style.height = (opts.height || 360) + "px";
    el.style.left = (40 + (winCounter * 24) % 300) + "px";
    el.style.top = (40 + (winCounter * 24) % 200) + "px";

    el.innerHTML = `
      <div class="window-titlebar">
        <div class="title-text"><span>${opts.icon || "🗔"}</span><span>${opts.title || "Untitled"}</span></div>
        <div class="window-controls">
          <button class="btn-min" title="Minimize">_</button>
          <button class="btn-max" title="Maximize">▢</button>
          <button class="btn-close" title="Close">✕</button>
        </div>
      </div>
      <div class="window-body"></div>
    `;

    const body = el.querySelector(".window-body");
    if (typeof opts.content === "string") {
      body.innerHTML = opts.content;
    } else if (opts.content instanceof HTMLElement) {
      body.appendChild(opts.content);
    }

    getLayer().appendChild(el);

    // Taskbar entry
    const taskbarEl = document.createElement("button");
    taskbarEl.className = "taskbar-item";
    taskbarEl.textContent = `${opts.icon || "🗔"} ${opts.title || "Untitled"}`;
    taskbarEl.addEventListener("click", () => {
      if (el.classList.contains("hidden-window")) {
        toggleMinimize(id);
      } else {
        focusWindow(id);
      }
    });
    document.getElementById("taskbar-items").appendChild(taskbarEl);

    windows.set(id, { el, taskbarEl, onClose: opts.onClose });

    // Wire controls
    el.querySelector(".btn-close").addEventListener("click", () => closeWindow(id));
    el.querySelector(".btn-min").addEventListener("click", () => toggleMinimize(id));
    el.querySelector(".btn-max").addEventListener("click", () => toggleMaximize(id));
    el.addEventListener("mousedown", () => focusWindow(id));

    makeDraggable(el, el.querySelector(".window-titlebar"));

    focusWindow(id);

    if (opts.onMount) opts.onMount(body);

    return { id, bodyEl: body };
  }

  return { createWindow, closeWindow, focusWindow, toggleMinimize, toggleMaximize };
})();
