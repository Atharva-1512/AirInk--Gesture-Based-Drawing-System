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
// Finger Detection Helpers
// =====================

function fingerUp(tip, pip, lm){
  return lm[tip].y < lm[pip].y;
}

function fingerDown(tip, pip, lm){
  return lm[tip].y > lm[pip].y;
}

let drawing = false;
let lastX=null;
let lastY=null;

// =====================
// Main Logic
// =====================

hands.onResults(results => {

  if(results.multiHandLandmarks &&
     results.multiHandLandmarks.length > 0){

    const lm = results.multiHandLandmarks[0];

    const indexUp  = fingerUp(8,6,lm);
    const middleUp = fingerUp(12,10,lm);
    const ringUp   = fingerUp(16,14,lm);
    const pinkyUp  = fingerUp(20,18,lm);

    const indexDown  = fingerDown(8,6,lm);
    const middleDown = fingerDown(12,10,lm);
    const ringDown   = fingerDown(16,14,lm);
    const pinkyDown  = fingerDown(20,18,lm);

    // =====================
    // ✊ FIST → CLEAR SCREEN
    // =====================
    if(indexDown && middleDown && ringDown && pinkyDown){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        drawing=false;
        lastX=null;
        lastY=null;
        return;
    }

    // =====================
    // ☝️ DRAW MODE
    // =====================
    if(indexUp && !middleUp && !ringUp && !pinkyUp){
        drawing=true;
    }

    // =====================
    // ✌️ STOP DRAWING
    // =====================
    else if(indexUp && middleUp){
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