const gameState = new GameState();
let canvasEl;

function setup() {
  createCanvas(Math.min(1200, windowWidth), Math.min(800, windowHeight));
  canvasEl = document.querySelector("main > canvas");
  fixStylePositioning();
  canvasReady = true;
}

function draw() {
  background(220);
  gameState.render();
}

function windowResized() {
  resizeCanvas(Math.min(800, windowWidth), Math.min(600, windowHeight));
  fixStylePositioning();
}

function fixStylePositioning() {
  canvasEl.style.left = `${(windowWidth - width) / 2}px`;
  canvasEl.style.top = `${(windowHeight - height) / 2}px`;
}
