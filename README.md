# Platform Jumper

A Kaboom.js platformer with coins, enemies, sound effects, and game-state screens. Built from simple shapes — no sprite images.

## Project structure

```
SuperMarioGame/
├── index.html   # Page layout and styles
├── game.js      # Game logic, levels, UI, and states
├── sounds.js    # Procedural sound effects (Web Audio API)
└── README.md    # This file
```

## How to run

1. Open `index.html` in a modern web browser (Chrome, Edge, Firefox).
2. Kaboom.js loads from CDN on first visit — internet required once.
3. Click the page or press a key so the browser allows sound.

Optional local server:

```bash
npx serve .
```

## Controls

| Key | Action |
|-----|--------|
| **Space** | Start game / retry after losing |
| **← →** or **A D** | Move left / right |
| **Space**, **↑**, or **W** | Jump (only when grounded) |

## Gameplay

### Objective

- Play as a **tiny girl** (built from colored shapes).
- **Collect coins** for points — shown as `Coins: X / Y` at the top left.
- **Avoid red enemies** that patrol platforms.
- Reach the **gold goal** at the top right to win.

### Win

- Touch the goal while playing.
- A **celebration screen** appears with confetti, stars, your coin count, and a victory fanfare.

### Lose

You lose if you:

- Touch a **red enemy**
- **Fall off** the bottom of the screen

A **“You Lose! Try again”** screen appears — press **Space** to restart.

### Start

On load, a **“Start Game”** screen is shown — press **Space** to begin.

## Features

| Feature | Details |
|---------|---------|
| **Player** | Tiny girl with animated legs while running |
| **Coins** | 9 coins placed on reachable platforms |
| **Enemies** | 2 patrolling enemies on wide platforms only |
| **Score HUD** | Live coin counter on screen |
| **Sounds** | Jump, coin pickup, game start, lose, and win fanfare |
| **Game states** | Start → Playing → Won / Lost |

## Customization

Edit `game.js`:

- `MOVE_SPEED`, `JUMP_FORCE` — movement feel
- `platforms` — level layout
- `coinSpots` — coin positions `[x, y]`
- `enemySpots` — enemy spawn and patrol range `{ x, y, min, max }`

Edit `sounds.js` to tweak frequencies and durations for each sound effect.
