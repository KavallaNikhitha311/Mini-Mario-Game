// Procedural sound effects using the Web Audio API
const Sounds = (() => {
  let ctx = null;

  // Creates or resumes the shared audio context
  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // Plays one short beep at a given pitch
  function tone(freq, duration, type = "square", volume = 0.08, delay = 0) {
    try {
      const audio = getCtx();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + delay;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(start);
      osc.stop(start + duration);
    } catch (_) {
      // Ignore audio errors so gameplay continues
    }
  }

  // Wraps sound code so failures stay silent
  function safe(name, fn) {
    try {
      fn();
    } catch (_) {
      // Ignore audio errors so gameplay continues
    }
  }

  return {
    // Wakes up audio after a user key press
    resume() {
      safe("resume", () => getCtx());
    },

    // Quick rising blip when jumping
    jump() {
      safe("jump", () => {
        tone(320, 0.08, "square", 0.07);
        tone(520, 0.12, "square", 0.06, 0.05);
      });
    },

    // Bright ping when a coin is collected
    coin() {
      safe("coin", () => {
        tone(988, 0.06, "sine", 0.09);
        tone(1319, 0.14, "sine", 0.08, 0.06);
      });
    },

    // Short upbeat tone when gameplay begins
    start() {
      safe("start", () => {
        tone(440, 0.1, "triangle", 0.07);
        tone(554, 0.1, "triangle", 0.07, 0.1);
        tone(659, 0.18, "triangle", 0.08, 0.2);
      });
    },

    // Low descending tone on game over
    lose() {
      safe("lose", () => {
        tone(330, 0.2, "sawtooth", 0.07);
        tone(220, 0.35, "sawtooth", 0.08, 0.18);
        tone(165, 0.5, "sawtooth", 0.07, 0.35);
      });
    },

    // Victory fanfare with rising notes
    win() {
      safe("win", () => {
        const notes = [523, 659, 784, 1047, 784, 1047, 1319];
        notes.forEach((freq, i) => {
          tone(freq, 0.22, "triangle", 0.09, i * 0.14);
        });
        tone(1568, 0.6, "sine", 0.1, 1.0);
      });
    },
  };
})();
