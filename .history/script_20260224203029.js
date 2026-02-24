const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// MediaPipe Setup
// =====================

const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands:1,
  modelComplexity:1,
  minDetectionConfidence:0.7,
  minTrackingConfidence:0.7
});

// =====================
// Helper Functions
// =====================

// finger up check
function fingerUp(tip, pip, landmarks){
  return landmarks[tip].y < landmarks[pip].y;
}

let lastX = null;
let lastY = null;
let drawing = false;

// =====================
// Main Detection
// =====================

hands.onResults(results => {

  if(results.multiHandLandmarks &&
     results.multiHandLandmarks.length > 0){

    const lm = results.multiHandLandmarks[0];

    const indexUp  = fingerUp(8,6,lm);
    const middleUp = fingerUp(12,10,lm);
    const ringUp   = fingerUp(16,14,lm);
    const pinkyUp  = fingerUp(20,18,lm);

    // -------- Gesture Detection --------

    // ☝️ DRAW
    if(indexUp && !middleUp && !ringUp && !pinkyUp){
      drawing = true;
    }

    // ✌️ STOP DRAWING
    else if(indexUp && middleUp){
      drawing = false;
      lastX = null;
      lastY = null;
    }

    // 🖐 CLEAR SCREEN
    else if(indexUp && middleUp && ringUp && pinkyUp){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      drawing = false;
      lastX = null;
      lastY = null;
      return;
    }

    // -------- Drawing --------

    if(drawing){

      const finger = lm[8];

      const x = (1 - finger.x) * canvas.width;
      const y = finger.y * canvas.height;

      ctx.strokeStyle="cyan";
      ctx.lineWidth=5;
      ctx.lineCap="round";

      if(lastX!==null && lastY!==null){
        ctx.beginPath();
        ctx.moveTo(lastX,lastY);
        ctx.lineTo(x,y);
        ctx.stroke();
      }

      lastX = x;
      lastY = y;
    }

  } else {
    drawing=false;
    lastX=null;
    lastY=null;
  }
});

// =====================
// Camera
// =====================

const camera = new Camera(video,{
  onFrame: async ()=>{
    await hands.send({image:video});
  },
  width:640,
  height:480
});

camera.start();