class Entity {
  constructor(position) {
    this.position = position;
    this.moveCommands = [];
    this.acceleration = null;
    this.health = 100;
    this.maxHealth = 100;
    this.size = 28;
    this.lastSound = null;
  }

  get dead() {
    return this.health <= 0;
  }

  playSound(sound) {
    if (!this.lastSound || Date.now() - this.lastSound > 1000) {
      this.lastSound = Date.now();
      GameState.instance.playSound(sound);
    }
  }

  move(vector) {
    this.moveCommands.push(vector);
  }

  update() {
    if (this.acceleration === null) {
      this.acceleration = createVector(0, 0);
      this.position = createVector(this.position.x, this.position.y);
    }
    if (this.dead) return false;
    if (GameState.instance.currentState !== STATES.PLAYING) return false;
    return true;
  }

  takeDamage(damage) {
    this.health -= damage;
    return this.dead
  }

  render() {
    // health bar
    if (!this.dead) {
      push();
      noStroke();
      fill(150);
      rect(this.position.x - 16, this.position.y - 32, 32, 8);
      switch (true) {
        case this.health < this.maxHealth / 4:
          fill(255, 0, 0);
          break;
        case this.health < this.maxHealth / 2:
          fill(255, 255, 0);
          break;
        default:
          fill(0, 255, 0);
          break;
      }
      rect(this.position.x - 16, this.position.y - 32, 32 * (this.health / this.maxHealth), 8);
      pop();
    } else {
      fill(0)
      textSize(32);
      text("💀", this.position.x, this.position.y - 36);
    }
  }

  steer(vector) {
    this.acceleration.add(vector);
    this.angle = this.acceleration.heading();
  }

  doMovement() {
    this.acceleration.limit(STATICS.player.speed);
    this.angle = this.acceleration.heading();
    this.position.add(this.acceleration);
    this.acceleration.mult(this.drag || STATICS.entities.drag);

    this.keepInBounds();
  }

  keepInBounds() {
    if (this.position.x < 0) {
      this.position.x = 0;
    } else if (this.position.x > width) {
      this.position.x = width;
    }
    if (this.position.y < 0) {
      this.position.y = 0;
    } else if (this.position.y > height) {
      this.position.y = height;
    }
  }

  collide(obj) {
    this.position.sub(obj.acceleration || this.acceleration);
  }
}
