class Notify {
  constructor(position, text, sound = null, lifeTime = 1500, size = 16, color = 0) {
    this.position = position.dist === undefined ? position : position.copy();
    this.text = text;
    this.deathNote = Date.now() + lifeTime;
    this.size = size;
    this.color = color;
    this.collisions = false;
    if (sound) {
      this.GS.playSound(sound);
    }
  }

  get dead() {
    return Date.now() >= this.deathNote;
  }

  get GS() {
    return new GameState();
  }

  render() {
    if (this.position.dist === undefined) {
      this.position = createVector(this.position.x, this.position.y);
    }
    if (this.dead) return;
    push();
    fill(this.color);
    textSize(this.size);
    textAlign(CENTER, CENTER);
    text(this.text, this.position.x, this.position.y);
    pop();
  }

  update() {
    if (this.dead) {
      this.GS.removeGameObject(this);
    }
    this.position.y -= 0.01 * deltaTime;
    return true;
  }

  collide(obj) {
    // not implemented
  }
}
