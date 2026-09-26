/* ===== MINESWEEPER APP ===== */

window.WebzApps = window.WebzApps || {};

window.WebzApps.minesweeper = {
  title: "Minesweeper",
  icon: "💣",
  open() {
    const ROWS = 9, COLS = 9, MINES = 10;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-family:monospace; font-size:14px;">
        <div id="ms-count">💣 ${MINES}</div>
        <button id="ms-reset" style="font-size:16px;">🙂</button>
        <div id="ms-timer">⏱ 0</div>
      </div>
      <div id="ms-grid" style="display:grid; grid-template-columns:repeat(${COLS}, 24px); grid-template-rows:repeat(${ROWS}, 24px); gap:1px; background:#808080; width:fit-content;"></div>
    `;

    WebzWM.createWindow({
      title: "Minesweeper",
      icon: "💣",
      width: 280,
      height: 340,
      content: wrapper,
      onMount: (body) => {
        let board, revealedCount, flagCount, gameOver, timer, seconds, firstClick;
        const gridEl = body.querySelector("#ms-grid");
        const countEl = body.querySelector("#ms-count");
        const timerEl = body.querySelector("#ms-timer");
        const resetBtn = body.querySelector("#ms-reset");

        function newGame() {
          clearInterval(timer);
          seconds = 0;
          gameOver = false;
          revealedCount = 0;
          flagCount = 0;
          firstClick = true;
          resetBtn.textContent = "🙂";
          countEl.textContent = `💣 ${MINES}`;
          timerEl.textContent = "⏱ 0";

          board = [];
          for (let r = 0; r < ROWS; r++) {
            const row = [];
            for (let c = 0; c < COLS; c++) {
              row.push({ mine: false, revealed: false, flagged: false, adjacent: 0 });
            }
            board.push(row);
          }
          render();
        }

        function placeMines(avoidR, avoidC) {
          let placed = 0;
          while (placed < MINES) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if (board[r][c].mine) continue;
            if (Math.abs(r - avoidR) <= 1 && Math.abs(c - avoidC) <= 1) continue;
            board[r][c].mine = true;
            placed++;
          }
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (board[r][c].mine) continue;
              let count = 0;
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  const nr = r + dr, nc = c + dc;
                  if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) count++;
                }
              }
              board[r][c].adjacent = count;
            }
          }
        }

        function reveal(r, c) {
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
          const cell = board[r][c];
          if (cell.revealed || cell.flagged) return;
          cell.revealed = true;
          revealedCount++;
          if (cell.adjacent === 0 && !cell.mine) {
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr || dc) reveal(r + dr, c + dc);
              }
            }
          }
        }

        function checkWin() {
          return revealedCount === ROWS * COLS - MINES;
        }

        function endGame(won) {
          gameOver = true;
          clearInterval(timer);
          resetBtn.textContent = won ? "😎" : "💀";
          if (!won) {
            for (let r = 0; r < ROWS; r++)
              for (let c = 0; c < COLS; c++)
                if (board[r][c].mine) board[r][c].revealed = true;
          }
          render();
        }

        function render() {
          gridEl.innerHTML = "";
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              const cell = board[r][c];
              const div = document.createElement("div");
              div.style.width = "24px";
              div.style.height = "24px";
              div.style.display = "flex";
              div.style.alignItems = "center";
              div.style.justifyContent = "center";
              div.style.fontSize = "12px";
              div.style.fontWeight = "bold";
              div.style.cursor = "pointer";
              div.style.userSelect = "none";

              if (cell.revealed) {
                div.style.background = "#d0d0d0";
                div.style.border = "1px solid #a0a0a0";
                if (cell.mine) {
                  div.textContent = "💣";
                  div.style.background = "#ff6666";
                } else if (cell.adjacent > 0) {
                  const colors = ["", "blue", "green", "red", "purple", "maroon", "turquoise", "black", "gray"];
                  div.style.color = colors[cell.adjacent];
                  div.textContent = cell.adjacent;
                }
              } else {
                div.style.background = "#c0c0c0";
                div.style.border = "2px solid #dfdfdf";
                div.style.borderRightColor = "#000";
                div.style.borderBottomColor = "#000";
                if (cell.flagged) div.textContent = "🚩";
              }

              div.addEventListener("click", () => {
                if (gameOver || cell.flagged) return;
                if (firstClick) {
                  placeMines(r, c);
                  firstClick = false;
                  seconds = 0;
                  timer = setInterval(() => {
                    seconds++;
                    timerEl.textContent = `⏱ ${seconds}`;
                  }, 1000);
                }
                if (cell.mine) {
                  cell.revealed = true;
                  endGame(false);
                  return;
                }
                reveal(r, c);
                if (checkWin()) endGame(true);
                render();
              });

              div.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                if (gameOver || cell.revealed) return;
                cell.flagged = !cell.flagged;
                flagCount += cell.flagged ? 1 : -1;
                countEl.textContent = `💣 ${MINES - flagCount}`;
                render();
              });

              gridEl.appendChild(div);
            }
          }
        }

        resetBtn.addEventListener("click", newGame);
        newGame();
      },
    });
  },
};
