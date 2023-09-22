class Boss {
  constructor(position, size, hp) {
    this.position = position;
    this.size = size;
    this.health = hp;
    this.maxHealth = hp;
    this.lastSound = null;
    this.timeOfDeath = null;
    this.collisions = true;
    this.angle = 0;
    this.lastAttack = null;
  }

  get GS() {
    return new GameState(); // singleton gets existing instance
  }

  get dead() {
    return this.health <= 0;
  }

  get attackSpeed() { 
    return map(Math.min(this.GS.level, 100), 0, 100, 1000, STATICS.robot.bossFastestAttackSpeed);
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.playSound("robotDeath");
      this.collisions = false;
      this.timeOfDeath = Date.now();
    }
    return this.dead;
  }

  collide(obj) {
    this.takeDamage(obj.damage);
  }

  playSound(sound) {
    if (!this.lastSound || Date.now() - this.lastSound > 500) {
      this.lastSound = Date.now();
      this.GS.playSound(sound);
    }
  }

  render() {
    if (this.dead) {
      push()
      fill(0);
      textSize(map(this.size, 250, 500, 16, 64));
      textAlign(CENTER, CENTER);
      text("💀", this.position.x, this.position.y);
      pop();
      return;
    }
    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle);
    imageMode(CENTER);
    image(images.robot, 0, 0, this.size, this.size);
    pop();
    // giant healthbar across the bottom of the screen
    push();
    noStroke();
    fill(150);
    const fullWidth = STATICS.width * 0.8;
    rect(STATICS.width * 0.1, STATICS.height - 50, fullWidth, 16);
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
    rect(map((this.health / this.maxHealth) * 100, 0, 100, fullWidth, STATICS.width * 0.1), STATICS.height - 50, fullWidth * (this.health / this.maxHealth), 16);
    pop();
  }

  update() {
    if (this.position.dist === undefined) {
      this.position = createVector(this.position.x, this.position.y);
    }
    if (this.timeOfDeath && Date.now() - this.timeOfDeath > 1500) {
      this.GS.removeGameObject(this);
      return false;
    }
    if (this.dead) return false;
    if (this.GS.currentState !== STATES.PLAYING) return false;

    // lerp angle towards player
    let player = this.GS.player;
    let targetAngle = atan2(player.position.y - this.position.y, player.position.x - this.position.x);
    this.angle = lerp(this.angle, targetAngle, 0.1);

    // attack player
    if (!this.lastAttack || Date.now() - this.lastAttack > this.attackSpeed) {
      this.lastAttack = Date.now();
      this.GS.gameObjects.push(new Thrower(this.position.copy(), this.angle, true));
      this.GS.playSound("woosh1");
    }
    return true;
  }
}
