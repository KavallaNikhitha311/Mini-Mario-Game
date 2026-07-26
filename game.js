kaboom({
  width: 800,
  height: 450,
  background: [135, 206, 235],
});

setGravity(1600);

const MOVE_SPEED = 320;
const JUMP_FORCE = 640;
const PLAYER_START = vec2(60, 360);

const platforms = [
  { x: 0, y: 402, w: 800, h: 48, ground: true },
  { x: 120, y: 320, w: 140, h: 20 },
  { x: 320, y: 250, w: 120, h: 20 },
  { x: 500, y: 180, w: 160, h: 20 },
  { x: 650, y: 300, w: 100, h: 20 },
  { x: 200, y: 150, w: 100, h: 20 },
  { x: 420, y: 100, w: 140, h: 20 },
];

const coinSpots = [
  [40, 370],
  [180, 370],
  [190, 290],
  [380, 220],
  [580, 150],
  [690, 270],
  [240, 120],
  [490, 70],
  [720, 370],
];

// Enemies only on wide platforms — narrow coin routes stay clear
const enemySpots = [
  { x: 520, y: 402, min: 460, max: 620 },
  { x: 540, y: 180, min: 520, max: 610 },
];

let gameState = "start";
let score = 0;
let totalCoins = 0;
let player = null;
let scoreLabel = null;

// Runs code safely so errors never stop the game
function safeRun(fn) {
  try {
    fn();
  } catch (err) {
    if (typeof debug !== "undefined" && debug.log) {
      debug.log("Game warning:", err?.message || err);
    }
  }
}

// True only while the player can move and interact
function isPlaying() {
  return gameState === "playing";
}

// Builds platforms, coins, enemies, goal, and the player
function buildLevel() {
  for (const p of platforms) {
    add([
      rect(p.w, p.h),
      pos(p.x, p.y),
      area(),
      body({ isStatic: true }),
      color(p.ground ? 34 : 139, p.ground ? 139 : 90, p.ground ? 34 : 43),
      "platform",
    ]);
  }

  const clouds = [
    [100, 40, 60, 20],
    [300, 60, 80, 24],
    [550, 30, 70, 22],
  ];

  for (const [x, y, w, h] of clouds) {
    add([
      rect(w, h),
      pos(x, y),
      color(255, 255, 255),
      opacity(0.85),
      fixed(),
      z(-10),
    ]);
  }

  add([
    rect(24, 24),
    pos(760, 76),
    area(),
    color(255, 215, 0),
    "goal",
  ]);

  totalCoins = coinSpots.length;
  for (const [x, y] of coinSpots) {
    add([
      rect(16, 16),
      pos(x, y),
      anchor("center"),
      area(),
      color(255, 215, 0),
      "coin",
    ]);
  }

  for (const e of enemySpots) {
    add([
      rect(22, 22),
      pos(e.x, e.y),
      anchor("botleft"),
      area(),
      color(180, 30, 30),
      "enemy",
      {
        patrolMin: e.min,
        patrolMax: e.max,
        speed: rand(70, 110),
        dir: choose([-1, 1]),
      },
    ]);
  }

  player = createGirl(PLAYER_START);
}

// Creates the girl player with movement, collisions, and leg animation
function createGirl(startPos) {
  const girl = add([
    rect(20, 34),
    pos(startPos),
    anchor("botleft"),
    area(),
    body(),
    color(255, 105, 180),
    "player",
    {
      legPhase: 0,
      facing: 1,
      baseLeftLeg: vec2(4, -8),
      baseRightLeg: vec2(11, -8),
    },
  ]);

  girl.add([
    rect(14, 6),
    pos(3, -34),
    color(80, 50, 30),
  ]);

  girl.add([
    rect(12, 12),
    pos(4, -32),
    color(255, 210, 180),
  ]);

  girl.leftLeg = girl.add([
    rect(5, 8),
    pos(4, -8),
    color(255, 210, 180),
  ]);

  girl.rightLeg = girl.add([
    rect(5, 8),
    pos(11, -8),
    color(255, 210, 180),
  ]);

  girl.onCollide("coin", (coin) => {
    if (!isPlaying()) return;
    destroy(coin);
    score += 1;
    updateScoreLabel();
    safeRun(() => Sounds.coin());
  });

  girl.onCollide("goal", () => {
    if (!isPlaying()) return;
    triggerWin();
  });

  girl.onCollide("enemy", () => {
    if (!isPlaying()) return;
    triggerLose();
  });

  girl.onUpdate(() => {
    if (!isPlaying()) return;

    if (girl.pos.y > height() + 40) {
      triggerLose();
      return;
    }

    const movingLeft =
      isKeyDown("left") || isKeyDown("a");
    const movingRight =
      isKeyDown("right") || isKeyDown("d");
    const moving = movingLeft || movingRight;

    if (movingLeft) girl.facing = -1;
    if (movingRight) girl.facing = 1;

    if (moving && girl.isGrounded()) {
      girl.legPhase += dt() * 14;
      const swing = Math.sin(girl.legPhase) * 3;
      girl.leftLeg.pos = girl.baseLeftLeg.add(vec2(swing * girl.facing, 0));
      girl.rightLeg.pos = girl.baseRightLeg.add(vec2(-swing * girl.facing, 0));
    } else {
      girl.leftLeg.pos = girl.baseLeftLeg;
      girl.rightLeg.pos = girl.baseRightLeg;
    }
  });

  return girl;
}

// Registers keyboard input for move, jump, start, and retry
function setupControls() {
  onKeyDown("left", () => {
    if (!player || !isPlaying()) return;
    player.move(-MOVE_SPEED, 0);
  });

  onKeyDown("right", () => {
    if (!player || !isPlaying()) return;
    player.move(MOVE_SPEED, 0);
  });

  onKeyDown("a", () => {
    if (!player || !isPlaying()) return;
    player.move(-MOVE_SPEED, 0);
  });

  onKeyDown("d", () => {
    if (!player || !isPlaying()) return;
    player.move(MOVE_SPEED, 0);
  });

  // Jumps only when the player is standing on a platform
  function tryJump() {
    if (!player || !isPlaying()) return;
    if (player.isGrounded()) {
      player.jump(JUMP_FORCE);
      safeRun(() => Sounds.jump());
    }
  }

  onKeyPress("up", tryJump);
  onKeyPress("w", tryJump);

  onKeyPress("space", () => {
    safeRun(() => Sounds.resume());
    if (gameState === "start") {
      beginGame();
    } else if (gameState === "lost") {
      restartGame();
    } else {
      tryJump();
    }
  });
}

// Refreshes the coin counter text on screen
function updateScoreLabel() {
  if (scoreLabel) {
    scoreLabel.text = `Coins: ${score} / ${totalCoins}`;
  }
}

// Shows the coin score in the top-left corner
function createHud() {
  scoreLabel = add([
    text(`Coins: ${score} / ${totalCoins}`, { size: 22 }),
    pos(16, 16),
    color(255, 255, 255),
    fixed(),
    z(100),
    "hud",
  ]);
}

// Draws a dark screen with a title and subtitle message
function showOverlay(title, subtitle, tag) {
  add([
    rect(width(), height()),
    pos(0, 0),
    color(0, 0, 0),
    opacity(0.55),
    fixed(),
    z(200),
    tag,
  ]);

  add([
    text(title, { size: 46 }),
    pos(width() / 2, height() / 2 - 30),
    anchor("center"),
    color(255, 255, 255),
    fixed(),
    z(201),
    tag,
  ]);

  add([
    text(subtitle, { size: 20 }),
    pos(width() / 2, height() / 2 + 24),
    anchor("center"),
    color(220, 220, 220),
    fixed(),
    z(201),
    tag,
  ]);
}

// Shows the first "Start Game" screen
function showStartScreen() {
  gameState = "start";
  showOverlay("Start Game", "Press SPACE to begin your adventure!", "overlay");
}

// Hides start screen and begins gameplay
function beginGame() {
  if (gameState !== "start") return;
  destroyAll("overlay");
  gameState = "playing";
  safeRun(() => Sounds.start());
}

// Ends the run when the player hits an enemy or falls
function triggerLose() {
  if (gameState !== "playing") return;
  gameState = "lost";
  safeRun(() => Sounds.lose());
  showOverlay("You Lose!", "Try again — press SPACE", "overlay");
}

// Ends the run when the player reaches the goal
function triggerWin() {
  if (gameState !== "playing") return;
  gameState = "won";
  safeRun(() => Sounds.win());
  showCelebration();
}

// Shows win text, score, confetti, and sparkles
function showCelebration() {
  destroyAll("overlay");

  add([
    rect(width(), height()),
    color(20, 10, 60),
    opacity(0.7),
    fixed(),
    z(200),
    "celebration",
  ]);

  add([
    text("YOU WON!", { size: 58 }),
    pos(width() / 2, height() / 2 - 50),
    anchor("center"),
    color(255, 215, 0),
    fixed(),
    z(201),
    "celebration",
  ]);

  add([
    text(`Amazing! You collected ${score} / ${totalCoins} coins`, { size: 22 }),
    pos(width() / 2, height() / 2 + 4),
    anchor("center"),
    color(255, 255, 255),
    fixed(),
    z(201),
    "celebration",
  ]);

  add([
    text("Celebration time!", { size: 18 }),
    pos(width() / 2, height() / 2 + 40),
    anchor("center"),
    color(200, 255, 200),
    fixed(),
    z(201),
    "celebration",
  ]);

  const colors = [
    rgb(255, 99, 132),
    rgb(255, 206, 86),
    rgb(75, 192, 192),
    rgb(153, 102, 255),
    rgb(255, 159, 64),
    rgb(255, 105, 180),
  ];

  loop(0.07, () => {
    if (gameState !== "won") return;
    add([
      rect(rand(6, 12), rand(6, 12)),
      pos(rand(0, width()), -12),
      color(choose(colors)),
      anchor("center"),
      move(DOWN, rand(120, 260)),
      rotate(rand(0, 360)),
      lifespan(2.5, { fade: 0.4 }),
      fixed(),
      z(202),
      "celebration",
    ]);
  });

  loop(0.12, () => {
    if (gameState !== "won") return;
    add([
      text(choose(["*", "+", "!", "★"]), { size: rand(20, 36) }),
      pos(rand(40, width() - 40), rand(40, height() - 40)),
      anchor("center"),
      color(choose(colors)),
      lifespan(0.8, { fade: 0.5 }),
      fixed(),
      z(203),
      "celebration",
    ]);
  });
}

// Clears the level and starts a fresh run after losing
function restartGame() {
  destroyAll("player");
  destroyAll("enemy");
  destroyAll("coin");
  destroyAll("goal");
  destroyAll("platform");
  destroyAll("overlay");
  destroyAll("celebration");
  destroyAll("hud");

  score = 0;
  buildLevel();
  createHud();
  gameState = "playing";
  safeRun(() => Sounds.start());
}

// Moves each enemy back and forth within its patrol range
onUpdate(() => {
  get("enemy").forEach((enemy) => {
    if (!isPlaying()) return;

    enemy.move(enemy.speed * enemy.dir, 0);

    if (enemy.pos.x <= enemy.patrolMin) {
      enemy.pos.x = enemy.patrolMin;
      enemy.dir = 1;
    }
    if (enemy.pos.x >= enemy.patrolMax) {
      enemy.pos.x = enemy.patrolMax;
      enemy.dir = -1;
    }
  });
});

// Bootstraps the game on page load
setupControls();
buildLevel();
createHud();
showStartScreen();
