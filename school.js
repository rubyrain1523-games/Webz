/* ===== WEBZ SCHOOL APP =====
   A list of short lessons, each with:
   - a plain-language explanation
   - an editable starter code box
   - a live sandboxed preview that updates as the student types

   Goal: student edits real code and immediately sees what changed.
*/

window.WebzApps = window.WebzApps || {};

const WEBZ_LESSONS = [
  {
    id: "html-what",
    category: "HTML",
    title: "What is HTML?",
    explanation: "HTML stands for HyperText Markup Language. It's how you tell a browser what's on a page: this is a heading, this is a paragraph, this is a button. Try changing the text below and see the preview update!",
    starter: `<h1>Hello, Webz!</h1>\n<p>I am learning HTML.</p>`,
  },
  {
    id: "html-structure",
    category: "HTML",
    title: "Page Structure",
    explanation: "Most tags come in pairs: an opening tag like <div> and a closing tag like </div>. Everything between them is 'inside' that tag. Try adding a new <div> below with something inside it.",
    starter: `<div>\n  <h2>My Section</h2>\n  <p>This paragraph is inside the div.</p>\n</div>`,
  },
  {
    id: "html-headings",
    category: "HTML",
    title: "Headings",
    explanation: "Headings go from <h1> (biggest, most important) to <h6> (smallest). Use them to organize your page, like a title and subtitles. Try changing the numbers below.",
    starter: `<h1>This is an h1</h1>\n<h2>This is an h2</h2>\n<h3>This is an h3</h3>`,
  },
  {
    id: "html-paragraphs",
    category: "HTML",
    title: "Paragraphs",
    explanation: "The <p> tag is for regular blocks of text — like this explanation! Try writing your own paragraph about your favorite hobby.",
    starter: `<p>Write a paragraph about something you like here.</p>`,
  },
  {
    id: "html-links",
    category: "HTML",
    title: "Links",
    explanation: "The <a> tag makes a clickable link. The href attribute says where it goes. Try changing the text or the URL.",
    starter: `<a href="https://example.com">Click me to visit a website!</a>`,
  },
  {
    id: "html-images",
    category: "HTML",
    title: "Images",
    explanation: "The <img> tag shows a picture. It needs a src (where the image file is) and should have alt text describing it (helpful for accessibility). Try changing the src URL.",
    starter: `<img src="https://via.placeholder.com/200x120" alt="a placeholder image" style="max-width:100%;">`,
  },
  {
    id: "html-buttons",
    category: "HTML",
    title: "Buttons",
    explanation: "The <button> tag makes a clickable button. Try changing the text on the button below.",
    starter: `<button>Click Me!</button>`,
  },
  {
    id: "html-lists",
    category: "HTML",
    title: "Lists",
    explanation: "<ul> makes a bullet list, <ol> makes a numbered list. Each item goes inside an <li> tag. Try adding a few more items.",
    starter: `<ul>\n  <li>First item</li>\n  <li>Second item</li>\n  <li>Third item</li>\n</ul>`,
  },
  {
    id: "css-colors",
    category: "CSS",
    title: "Colors",
    explanation: "CSS controls how things look. The style attribute lets you add CSS right on a tag. Try changing the color values below (you can use names like 'red' or hex codes like #ff00ff).",
    starter: `<h1 style="color: purple;">Purple heading</h1>\n<p style="color: green;">Green paragraph</p>`,
  },
  {
    id: "css-fonts",
    category: "CSS",
    title: "Fonts",
    explanation: "font-family changes the typeface, and font-size changes how big text is. Try different values!",
    starter: `<p style="font-family: 'Courier New', monospace; font-size: 20px;">This text uses a monospace font.</p>`,
  },
  {
    id: "css-backgrounds",
    category: "CSS",
    title: "Backgrounds",
    explanation: "background-color sets the color behind an element. Try changing it, or add padding to give it some breathing room.",
    starter: `<div style="background-color: lightblue; padding: 20px;">\n  <p>I have a background color!</p>\n</div>`,
  },
  {
    id: "css-borders",
    category: "CSS",
    title: "Borders",
    explanation: "border adds a line around an element. It needs a width, a style (like solid or dashed), and a color. Try changing them.",
    starter: `<div style="border: 3px dashed orange; padding: 12px;">\n  <p>I have a border!</p>\n</div>`,
  },
  {
    id: "css-spacing",
    category: "CSS",
    title: "Spacing",
    explanation: "padding adds space INSIDE an element's border. margin adds space OUTSIDE it. Try changing the numbers and watch the boxes move apart.",
    starter: `<div style="background:#eee; padding: 20px; margin: 30px; border:1px solid #999;">\n  <p>Padding and margin in action.</p>\n</div>`,
  },
  {
    id: "css-layout",
    category: "CSS",
    title: "Layout",
    explanation: "display: flex lets you line up elements in a row easily, and gap adds space between them. Try changing gap or adding more boxes.",
    starter: `<div style="display:flex; gap:10px;">\n  <div style="background:#ffb703; padding:16px;">Box 1</div>\n  <div style="background:#8ecae6; padding:16px;">Box 2</div>\n  <div style="background:#fb8500; padding:16px;">Box 3</div>\n</div>`,
  },
];

window.WebzApps.school = {
  title: "Webz School",
  icon: "📚",
  open() {
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.style.display = "flex";
    wrapper.style.gap = "8px";
    wrapper.style.fontFamily = "'Tahoma', sans-serif";
    wrapper.style.fontSize = "12px";

    wrapper.innerHTML = `
      <div id="ws-sidebar" style="width:170px; overflow-y:auto; border-right:1px solid #999; padding-right:6px;"></div>
      <div id="ws-main" style="flex:1; display:flex; flex-direction:column; min-width:0;">
        <h3 id="ws-title" style="margin:0 0 6px 0;"></h3>
        <p id="ws-explanation" style="margin:0 0 8px 0; color:#333;"></p>
        <div style="flex:1; display:flex; gap:8px; min-height:0;">
          <textarea id="ws-code" spellcheck="false" style="flex:1; font-family:'Courier New',monospace; font-size:12px; resize:none; padding:6px;"></textarea>
          <iframe id="ws-preview" sandbox="allow-scripts" style="flex:1; border:2px inset #808080; background:white;"></iframe>
        </div>
        <button id="ws-reset" style="align-self:flex-start; margin-top:6px;">↺ Reset this lesson</button>
      </div>
    `;

    WebzWM.createWindow({
      title: "Webz School",
      icon: "📚",
      width: 700,
      height: 480,
      content: wrapper,
      onMount: (body) => initSchool(body),
    });
  },
};

function initSchool(body) {
  const sidebar = body.querySelector("#ws-sidebar");
  const titleEl = body.querySelector("#ws-title");
  const explanationEl = body.querySelector("#ws-explanation");
  const codeEl = body.querySelector("#ws-code");
  const previewEl = body.querySelector("#ws-preview");
  const resetBtn = body.querySelector("#ws-reset");

  let currentLesson = null;

  // Build sidebar grouped by category
  const categories = [...new Set(WEBZ_LESSONS.map((l) => l.category))];
  categories.forEach((cat) => {
    const catHeader = document.createElement("div");
    catHeader.textContent = cat;
    catHeader.style.fontWeight = "bold";
    catHeader.style.marginTop = "8px";
    catHeader.style.color = "#000080";
    sidebar.appendChild(catHeader);

    WEBZ_LESSONS.filter((l) => l.category === cat).forEach((lesson) => {
      const item = document.createElement("div");
      item.textContent = lesson.title;
      item.className = "ws-lesson-item";
      item.style.padding = "4px 6px";
      item.style.cursor = "pointer";
      item.dataset.id = lesson.id;
      item.addEventListener("click", () => loadLesson(lesson.id));
      sidebar.appendChild(item);
    });
  });

  function highlightActive(id) {
    sidebar.querySelectorAll(".ws-lesson-item").forEach((el) => {
      const active = el.dataset.id === id;
      el.style.background = active ? "#000080" : "";
      el.style.color = active ? "white" : "black";
    });
  }

  function loadLesson(id) {
    const lesson = WEBZ_LESSONS.find((l) => l.id === id);
    if (!lesson) return;
    currentLesson = lesson;
    titleEl.textContent = `${lesson.category}: ${lesson.title}`;
    explanationEl.textContent = lesson.explanation;

    const savedCode = localStorage.getItem("webz_school_" + id);
    codeEl.value = savedCode !== null ? savedCode : lesson.starter;
    updatePreview();
    highlightActive(id);
  }

  function updatePreview() {
    previewEl.srcdoc = codeEl.value;
  }

  let debounce;
  codeEl.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      updatePreview();
      if (currentLesson) {
        localStorage.setItem("webz_school_" + currentLesson.id, codeEl.value);
      }
    }, 300);
  });

  resetBtn.addEventListener("click", () => {
    if (!currentLesson) return;
    codeEl.value = currentLesson.starter;
    localStorage.removeItem("webz_school_" + currentLesson.id);
    updatePreview();
  });

  // Load the first lesson by default
  loadLesson(WEBZ_LESSONS[0].id);
}
