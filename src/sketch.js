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
  sounds.pickup = loadSound('sounds/pickup.ogg');
  sounds.woosh1 = loadSound('sounds/woosh1.ogg');
  sounds.gem = loadSound('sounds/gem.ogg');
  sounds.robotDeath = loadSound('sounds/robotDeath.ogg');
  sounds.bleep1 = loadSound('sounds/bleep1.ogg');
  
  sounds.music = loadSound('sounds/tense-detective-looped-drone-10054.mp3');
  sounds.music.setVolume(0.2);

  images.crate = loadImage('images/crate.png');
  images.crateOpen = loadImage('images/crate-open.png');
  images.player = loadImage('images/player.png');
  images.robot = loadImage('images/robot.png');
  images.gem = loadImage('images/gem.png');
  images.knife = loadImage('images/knife.png');
  images.exit = loadImage('images/exit.png');
  images.warehouse = loadImage('images/warehouse-floor.png');
}

function setup() {
  createCanvas(STATICS.width, STATICS.height);
  canvasEl = document.querySelector("main > canvas");
  fixStylePositioning();
  images.warehouse.resize(STATICS.width, STATICS.height);
  canvasReady = true;
}

function draw() {
  imageMode(CORNER);
  background(images.warehouse)
  imageMode(CENTER);
  gameState.fixedUpdate();
}

function windowResized() {
  resizeCanvas(STATICS.width, STATICS.height);
  fixStylePositioning();
  images.warehouse.resize(STATICS.width, STATICS.height);
}

function fixStylePositioning() {
  canvasEl.style.left = `${(windowWidth - width) / 2}px`;
  canvasEl.style.top = `${(windowHeight - height) / 2}px`;
}


function mousePressed() {
  gameState.mousePressed(mouseX, mouseY);
}