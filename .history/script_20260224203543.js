<script>
const video        = document.getElementById("video");
const canvas       = document.getElementById("canvas");
const ctx          = canvas.getContext("2d");
const gestureLabel = document.getElementById("gesture-label");
const cursorEl     = document.getElementById("cursor");
const eraseFlash   = document.getElementById("erase-flash");

// ── Resize ──────────────────────────────────────────────
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// ── Drawing state ────────────────────────────────────────
let lastX = null, lastY = null;
let currentGesture = "none"; // "draw" | "pause" | "erase" | "none"

// Brush colour cycling
const COLOURS = ["#00f5d4","#f5a623","#a78bfa","#f472b6","#60a5fa","#facc15"];
let colourIndex = 0;
let framesSinceColourChange = 0;

// ── Gesture Detection ────────────────────────────────────

/**
 * Returns true if a fingertip (tip) is above its pip (knuckle)
 * meaning the finger is extended upward.
 */
function isFingerUp(landmarks, tipIdx, pipIdx) {
  return landmarks[tipIdx].y < landmarks[pipIdx].y;
}

/**
 * Count how many of the 4 non-thumb fingers are extended.
 * Fingers: index=8/6, middle=12/10, ring=16/14, pinky=20/18
 */
function countExtendedFingers(lm) {
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];
  let count = 0;
  for (let i = 0; i < 4; i++) {
    if (isFingerUp(lm, tips[i], pips[i])) count++;
  }
  return count;
}

/**
 * Check if thumb is extended (tip far from palm base horizontally).
 * Works for both hands by checking absolute horizontal distance.
 */
function isThumbUp(lm) {
  return Math.abs(lm[4].x - lm[2].x) > 0.08;
}

/**
 * Classify gesture:
 *   "erase"  – 4+ fingers extended (open palm)
 *   "pause"  – exactly 2 fingers extended (index + middle)
 *   "draw"   – exactly 1 finger extended (index only)
 *   "none"   – otherwise
 */
function classifyGesture(lm) {
  const extended = countExtendedFingers(lm);
  if (extended >= 4)           return "erase";
  if (extended === 2 &&
      isFingerUp(lm, 8, 6) &&
      isFingerUp(lm, 12, 10)) return "pause";
  if (extended === 1 &&
      isFingerUp(lm, 8, 6))   return "draw";
  return "none";
}

// ── HUD helpers ──────────────────────────────────────────
function setGestureUI(g, x, y) {
  const labels = {
    draw:  "● DRAWING",
    pause: "⏸ PAUSED",
    erase: "✕ ERASING",
    none:  "NO GESTURE",
  };
  gestureLabel.textContent = labels[g] || "WAITING…";
  gestureLabel.className   = g;

  cursorEl.style.left    = x + "px";
  cursorEl.style.top     = y + "px";
  cursorEl.style.opacity = x ? "1" : "0";
  cursorEl.className     = g;
}

// ── MediaPipe callback ───────────────────────────────────
function onResults(results) {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    lastX = null; lastY = null;
    setGestureUI("none", 0, 0);
    return;
  }

  const lm = results.multiHandLandmarks[0];
  const gesture = classifyGesture(lm);

  // Index fingertip for pointer position (mirrored)
  const finger = lm[8];
  const sx = (1 - finger.x) * canvas.width;
  const sy = finger.y        * canvas.height;

  setGestureUI(gesture, sx, sy);

  // ── ERASE ───────────────────────────────────────────────
  if (gesture === "erase") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastX = null; lastY = null;

    eraseFlash.classList.add("active");
    setTimeout(() => eraseFlash.classList.remove("active"), 300);

    // Advance colour on next draw
    colourIndex = (colourIndex + 1) % COLOURS.length;
    return;
  }

  // ── PAUSE ───────────────────────────────────────────────
  if (gesture === "pause") {
    lastX = null; lastY = null;
    return;
  }

  // ── DRAW ────────────────────────────────────────────────
  if (gesture === "draw") {
    framesSinceColourChange++;

    // Slowly cycle colour every ~180 frames (~6 s at 30fps)
    if (framesSinceColourChange > 180) {
      colourIndex = (colourIndex + 1) % COLOURS.length;
      framesSinceColourChange = 0;
    }

    ctx.strokeStyle = COLOURS[colourIndex];
    ctx.lineWidth   = 4;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    if (lastX !== null && lastY !== null) {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }

    lastX = sx;
    lastY = sy;
    return;
  }

  // "none" – lift pen
  lastX = null; lastY = null;
}

// ── MediaPipe Hands ──────────────────────────────────────
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands:           1,
  modelComplexity:       1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence:  0.7,
});

hands.onResults(onResults);

// ── Camera ────────────────────────────────────────────────
const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width:  640,
  height: 480,
});

camera.start();
</script>