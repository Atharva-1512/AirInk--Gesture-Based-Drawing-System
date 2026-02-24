const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands:1,
  minDetectionConfidence:0.7,
  minTrackingConfidence:0.7
});

let lastX = null;
let lastY = null;

hands.onResults(results => {

  if(results.multiHandLandmarks.length > 0){

    const finger =
      results.multiHandLandmarks[0][8]; // index finger

    const x = finger.x * canvas.width;
    const y = finger.y * canvas.height;

    if(lastX && lastY){
      ctx.beginPath();
      ctx.moveTo(lastX,lastY);
      ctx.lineTo(x,y);
      ctx.strokeStyle="cyan";
      ctx.lineWidth=5;
      ctx.stroke();
    }

    lastX = x;
    lastY = y;
  }
});



const camera = new Camera(video,{
  onFrame: async () => {
    await hands.send({image: video});
  },
  width:640,
  height:480
});

camera.start();