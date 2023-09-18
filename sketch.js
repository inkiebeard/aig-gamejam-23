let canvasEl;
const sounds = {}, images = {};

function preload() {
  soundFormats('ogg', 'mp3');
  sounds.ding = loadSound('sounds/ding.ogg');
  sounds.gameover = loadSound('sounds/gameover.ogg');
  sounds.robot = loadSound('sounds/robot_sad.ogg');
  sounds.robotAttack = loadSound('sounds/robotAttack.ogg');
  sounds.phaserUp1 = loadSound('sounds/phaserUp1.ogg');
  sounds.pop = loadSound('sounds/pop.ogg');
  sounds.confirm = loadSound('sounds/confirm.ogg');
  sounds.music = loadSound('sounds/tense-detective-looped-drone-10054.mp3');
  sounds.music.setVolume(0.3);

  images.crate = loadImage('images/crate.png');
  images.player = loadImage('images/player.png');
  images.robot = loadImage('images/robot.png');
  images.gem = loadImage('images/gem.png');
}

function setup() {
  createCanvas(Math.min(1200, windowWidth), Math.min(800, windowHeight));
  canvasEl = document.querySelector("main > canvas");
  fixStylePositioning();
  canvasReady = true;
}

function draw() {
  background(220);
  gameState.fixedUpdate();
}

function windowResized() {
  resizeCanvas(Math.min(1200, windowWidth), Math.min(800, windowHeight));
  fixStylePositioning();
}

function fixStylePositioning() {
  canvasEl.style.left = `${(windowWidth - width) / 2}px`;
  canvasEl.style.top = `${(windowHeight - height) / 2}px`;
}
