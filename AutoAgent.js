class AutoAgent {
  constructor(position) {
    this.position = position;
    this.moveCommands = [];
    this.vel = null;
    this.health = 100;
    this.maxHealth = 100;
    this.size = 28;
    this.lastSound = null;
    this.lastPos = null;
    this.timeOfDeath = null;
    this.acc = null;
    this.slowRadius = 10;
    this.target = null;
    this.speed = STATICS.entities.speed;
    this.lastPositions = [];
    this.collisions = true;
  }

  get GS() {
    return new GameState(); // singleton gets existing instance
  }

  get dead() {
    return this.health <= 0;
  }

  playSound(sound) {
    if (!this.lastSound || Date.now() - this.lastSound > 500) {
      this.lastSound = Date.now();
      this.GS.playSound(sound);
    }
  }

  move(vector) {
    this.moveCommands.push(vector.dist === undefined ? createVector(vector.x, vector.y) : vector);
  }

  update() {
    if (this.vel === null) {
      this.vel = createVector(0, 0);
      this.position = createVector(this.position.x, this.position.y);
      this.acc = createVector(0, 0);
    }
    if (this.timeOfDeath && Date.now() - this.timeOfDeath > 3500) {
      this.GS.removeGameObject(this);
      return false;
    }
    if (this.dead) return false;
    if (this.GS.currentState !== STATES.PLAYING) return false;
    return true;
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.playSound("robotDeath");
      this.timeOfDeath = Date.now();
    }
    return this.dead;
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
      fill(0);
      textSize(18);
      textAlign(CENTER, CENTER);
      text("💀", this.position.x, this.position.y);
    }

    if (this.target) {
      push();
      fill(0, 250, 0, 20);
      noStroke();
      circle(this.target.x, this.target.y, this.size * 0.7);
      pop();
    }
  }

  steer(vector) {
    this.acc.add(vector);
  }

  seek(goal) {
    let force = p5.Vector.sub(goal, this.position);
    let desiredSpeed = this.speed;
    let distance = force.mag();
    // arrive slowly
    if (distance < this.slowRadius) {
      desiredSpeed = map(distance, 0, this.slowRadius, 0, this.speed);
    }
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.speed);
    return force;
  }

  doMovement(ignoreTarget = false) {
    if (this.target && !ignoreTarget) {
      if (this.target.dist(this.position) > 10) {
        this.steer(this.seek(this.target));
      } else {
        this.target = null;
      }
    }
    this.lastPos = this.position ? this.position.copy() : null;
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.angle = this.vel.heading();
    this.position.add(this.vel);
    this.acc.set(0, 0);
    this.vel.mult(this.drag || STATICS.entities.drag);

    this.keepInBounds();
    this.lastPositions.push(this.position.copy());
    if (this.lastPositions.length > 10) {
      this.lastPositions.shift();
    }
    const avgPostMovement = this.lastPositions.map((pos, i) => (i > 0 ? pos.dist(this.lastPositions[i - 1]) : 0)).reduce((a, b) => a + b, 0) / this.lastPositions.length;
    if (this.target && avgPostMovement < 0.1) {
      if (this.target && this.target.dist(this.position) < 50) {
        this.target = null;
      } else {
        // shift position slightly to the right
        this.position.add(createVector(3, 0));
      }
    }
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

  lookAt(vector) {
    this.angle = p5.Vector.sub(vector, this.position).heading();
  }

  collide(obj) {
    this.position = this.lastPos;
    if (this.GS.checkOverlap(this, obj)) {
      this.position = this.position.copy().sub(this.vel.copy().mult(2));
    }
    if (!(obj instanceof Crate)) return
    const avgPostMovement = this.lastPositions.map((pos, i) => (i > 0 ? pos.dist(this.lastPositions[i - 1]) : 0)).reduce((a, b) => a + b, 0) / this.lastPositions.length;
    if (this.target && avgPostMovement < 0.1) {
      if (this.target && this.target.dist(this.position) < 50) {
        this.target = null;
      } else if(this.target) {
        // shift position slightly
        if (this.position.x < this.target.x) {
          this.position.add(createVector(-2, 0));
          if (this.position.y > this.target.y) {
            this.position.add(createVector(0, 2));
          }
        } else {
          this.position.add(createVector(2, 0));
          if (this.position.y < this.target.y) {
            this.position.add(createVector(0, -2));
          }
        }
      } else {
        // shift position slightly to the right
        this.position.add(createVector(3, 0));
      }
    } else if (avgPostMovement < 0.1) {
      this.position.add(createVector(3, 0));
    }
  }
}
