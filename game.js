const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const statusEl = document.getElementById("status");

const TILE = 40;
const COLS = 14;
const ROWS = 14;

const MAP = [
  "##############",
  "#....#.......#",
  "#.##.#.###.#.#",
  "#o#..G...#.#o#",
  "#.#.#####.#..#",
  "#.#...#...##.#",
  "#.###.#.###..#",
  "#.....P......#",
  "#.###.#.###..#",
  "#..##.#...#..#",
  "#.#.#####.#..#",
  "#o#....G.#.#o#",
  "#....#.......#",
  "##############",
];

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

const images = {
  pac: loadImage("shockedgirl_sprite.png"),
  ghostA: loadImage("diddy_sprite.png"),
  ghostB: loadImage("epstein_sprite.png"),
  power: loadImage("babyoil_sprite.png"),
};

let board;
let pac;
let ghosts;
let score;
let lives;
let poweredUntil;
let dotsLeft;
let nextDir;
let gameOver;

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function resetGame() {
  board = MAP.map((row) => row.split(""));
  ghosts = [];
  pac = { x: 1, y: 1, dir: { x: 0, y: 0 } };
  score = 0;
  lives = 3;
  poweredUntil = 0;
  dotsLeft = 0;
  nextDir = { x: 0, y: 0 };
  gameOver = false;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = board[y][x];
      if (cell === "P") {
        pac.x = x;
        pac.y = y;
        board[y][x] = ".";
      }
      if (cell === "G") {
        ghosts.push({
          x,
          y,
          spawnX: x,
          spawnY: y,
          dir: randomDir(),
          sprite: ghosts.length === 0 ? "ghostA" : "ghostB",
        });
        board[y][x] = ".";
      }
      if (cell === "." || cell === "o") {
        dotsLeft += 1;
      }
    }
  }

  updateHud("Running");
}

function updateHud(state) {
  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${lives}`;
  statusEl.textContent = `Status: ${state}`;
}

function randomDir() {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

function isWall(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) {
    return true;
  }
  return board[y][x] === "#";
}

function stepEntity(entity, preferredDir) {
  const tryDir = preferredDir || entity.dir;
  const targetX = entity.x + tryDir.x;
  const targetY = entity.y + tryDir.y;

  if (!isWall(targetX, targetY)) {
    entity.dir = tryDir;
    entity.x = targetX;
    entity.y = targetY;
    return true;
  }
  return false;
}

function update() {
  if (gameOver) {
    return;
  }

  if (nextDir.x !== 0 || nextDir.y !== 0) {
    stepEntity(pac, nextDir);
  }
  stepEntity(pac, pac.dir);

  const tile = board[pac.y][pac.x];
  if (tile === ".") {
    board[pac.y][pac.x] = " ";
    score += 10;
    dotsLeft -= 1;
  } else if (tile === "o") {
    board[pac.y][pac.x] = " ";
    score += 50;
    dotsLeft -= 1;
    poweredUntil = performance.now() + 7000;
  }

  for (const ghost of ghosts) {
    const choices = [ghost.dir, randomDir(), randomDir(), randomDir()];
    let moved = false;
    for (const dir of choices) {
      if (stepEntity(ghost, dir)) {
        moved = true;
        break;
      }
    }
    if (!moved) {
      ghost.dir = randomDir();
    }

    if (ghost.x === pac.x && ghost.y === pac.y) {
      if (performance.now() < poweredUntil) {
        score += 200;
        ghost.x = ghost.spawnX;
        ghost.y = ghost.spawnY;
      } else {
        lives -= 1;
        pac.x = 1;
        pac.y = 1;
        pac.dir = { x: 0, y: 0 };
        if (lives <= 0) {
          gameOver = true;
          updateHud("Game Over (press R)");
          return;
        }
      }
    }
  }

  if (dotsLeft <= 0) {
    gameOver = true;
    updateHud("You Win! (press R)");
    return;
  }

  updateHud(performance.now() < poweredUntil ? "Powered Up" : "Running");
}

function drawSpriteOrFallback(img, x, y, fallbackColor) {
  const px = x * TILE;
  const py = y * TILE;

  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, px + 4, py + 4, TILE - 8, TILE - 8);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.beginPath();
    ctx.arc(px + TILE / 2, py + TILE / 2, TILE * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const tile = board[y][x];
      const px = x * TILE;
      const py = y * TILE;

      if (tile === "#") {
        ctx.fillStyle = "#17308f";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = "#4f74ff";
        ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
      } else {
        ctx.fillStyle = "#020309";
        ctx.fillRect(px, py, TILE, TILE);

        if (tile === ".") {
          ctx.fillStyle = "#f4f4f4";
          ctx.beginPath();
          ctx.arc(px + TILE / 2, py + TILE / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === "o") {
          drawSpriteOrFallback(images.power, x, y, "#f9d14f");
        }
      }
    }
  }

  drawSpriteOrFallback(images.pac, pac.x, pac.y, "#f7d85f");

  for (const ghost of ghosts) {
    const vulnerable = performance.now() < poweredUntil;
    const fallback = vulnerable ? "#7fd3ff" : "#ff6b8e";
    drawSpriteOrFallback(images[ghost.sprite], ghost.x, ghost.y, fallback);
    if (vulnerable) {
      ctx.strokeStyle = "#d7f0ff";
      ctx.lineWidth = 2;
      ctx.strokeRect(ghost.x * TILE + 8, ghost.y * TILE + 8, TILE - 16, TILE - 16);
    }
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const dir = DIRS[event.key];
  if (dir) {
    nextDir = dir;
  }
  if (event.key.toLowerCase() === "r") {
    resetGame();
  }
});

resetGame();
loop();
