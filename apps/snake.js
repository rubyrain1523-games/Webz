/* ===== SNAKE APP ===== */

window.WebzApps = window.WebzApps || {};

window.WebzApps.snake = {
  title: "Snake",
  icon: "🐍",
  open() {
    const COLS = 20, ROWS = 20, CELL = 16;

    const wrapper = document.createElement("div");
    wrapper.style.textAlign = "center";
    wrapper.innerHTML = `
      <div style="font-family:monospace; margin-bottom:6px;">Score: <span id="sn-score">0</span></div>
      <canvas id="sn-canvas" width="${COLS * CELL}" height="${ROWS * CELL}" style="background:#000; border:2px solid #555;"></canvas>
      <div style="font-size:11px; color:#555; margin-top:6px;">Use arrow keys. Click the game first!</div>
    `;

    WebzWM.createWindow({
      title: "Snake",
      icon: "🐍",
      width: COLS * CELL + 40,
      height: ROWS * CELL + 110,
      content: wrapper,
      onClose: () => { running = false; },
      onMount: (body) => {
        const canvas = body.querySelector("#sn-canvas");
        const ctx = canvas.getContext("2d");
        const scoreEl = body.querySelector("#sn-score");

        let snake, dir, nextDir, food, score, running, loopId;

        function reset() {
          snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
          dir = { x: 1, y: 0 };
          nextDir = { x: 1, y: 0 };
          score = 0;
          scoreEl.textContent = score;
          placeFood();
          running = true;
        }

        function placeFood() {
          food = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS),
          };
        }

        function tick() {
          if (!running) return;
          dir = nextDir;
          const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

          // Wall collision
          if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            return gameOver();
          }
          // Self collision
          if (snake.some((s) => s.x === head.x && s.y === head.y)) {
            return gameOver();
          }

          snake.unshift(head);

          if (head.x === food.x && head.y === food.y) {
            score++;
            scoreEl.textContent = score;
            placeFood();
          } else {
            snake.pop();
          }

          draw();
        }

        function gameOver() {
          running = false;
          ctx.fillStyle = "rgba(0,0,0,0.7)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#fff";
          ctx.font = "16px monospace";
          ctx.textAlign = "center";
          ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 8);
          ctx.font = "12px monospace";
          ctx.fillText("Click to restart", canvas.width / 2, canvas.height / 2 + 14);
        }

        function draw() {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = "#ff5050";
          ctx.fillRect(food.x * CELL, food.y * CELL, CELL - 1, CELL - 1);

          snake.forEach((seg, i) => {
            ctx.fillStyle = i === 0 ? "#00ff66" : "#00aa44";
            ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL - 1, CELL - 1);
          });
        }

        canvas.addEventListener("click", () => {
          if (!running) {
            reset();
            draw();
          }
        });

        document.addEventListener("keydown", (e) => {
          if (!canvas.isConnected) return; // window was closed
          const key = e.key;
          if (key === "ArrowUp" && dir.y === 0) nextDir = { x: 0, y: -1 };
          else if (key === "ArrowDown" && dir.y === 0) nextDir = { x: 0, y: 1 };
          else if (key === "ArrowLeft" && dir.x === 0) nextDir = { x: -1, y: 0 };
          else if (key === "ArrowRight" && dir.x === 0) nextDir = { x: 1, y: 0 };
        });

        reset();
        draw();
        loopId = setInterval(tick, 120);
      },
    });
  },
};
