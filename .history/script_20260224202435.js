const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Fullscreen canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// MediaPipe Hands Setup
// =====================

const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// =====================
// Drawing Logic
// =====================

let lastX = null;
let lastY = null;

hands.onResults((results) => {

  if (
    results.multiHandLandmarks &&
    results.multiHandLandmarks.length > 0
  ) {

    // Index finger tip landmark
    const finger = results.multiHandLandmarks[0][8];

    // Convert normalized coords → screen coords
    const x = (1 - finger.x) * canvas.width;
    const y = finger.y * canvas.height;

    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    if (lastX !== null && lastY !== null) {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    lastX = x;
    lastY = y;

  } else {
    lastX = null;
    lastY = null;
  }
});

// =====================
// Camera Start
// =====================

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480,
});

camera.start();