const gameState = new GameState();

function setup() {
  createCanvas(Math.min(800, windowWidth), Math.min(600, windowHeight));
}

function draw() {
  background(220);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}