let smoothX = null;
let smoothY = null;
const smoothFactor = 0.7;


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
// Finger Helpers
// =====================

function fingerUp(tip, pip, lm){
  return lm[tip].y < lm[pip].y;
}

// Thumb works differently (x direction)
function thumbUp(lm){
  return lm[4].x < lm[3].x;
}

let drawing=false;
let lastX=null;
let lastY=null;

// =====================
// Main Detection Logic
// =====================

hands.onResults(results => {

  if(results.multiHandLandmarks &&
     results.multiHandLandmarks.length > 0){

    const lm = results.multiHandLandmarks[0];

    const thumb  = thumbUp(lm);
    const index  = fingerUp(8,6,lm);
    const middle = fingerUp(12,10,lm);
    const ring   = fingerUp(16,14,lm);
    const pinky  = fingerUp(20,18,lm);

    // =====================
    // 🖐 PALM → CLEAR SCREEN
    // =====================
    // 🖐 OPEN PALM → CLEAR CANVAS
if(index && middle && ring && pinky){

    // small delay protection (prevents repeated clearing)
    if(!window.palmDetected){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        drawing=false;
        lastX=null;
        lastY=null;

        window.palmDetected = true;
    }

    return;
} else {
    window.palmDetected = false;
}

    // =====================
    // ☝️ DRAW
    // =====================
    if(index && !middle && !ring && !pinky){
        drawing=true;
    }

    // =====================
    // ✌️ STOP DRAWING
    // =====================
    else if(index && middle){
        drawing=false;
        lastX=null;
        lastY=null;
    }

    // =====================
    // Drawing Execution
    // =====================
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

        lastX=x;
        lastY=y;
    }

  } else {
      drawing=false;
      lastX=null;
      lastY=null;
  }
});

// =====================
// Camera Start
// =====================

const camera = new Camera(video,{
  onFrame: async ()=>{
    await hands.send({image:video});
  },
  width:640,
  height:480
});

camera.start();