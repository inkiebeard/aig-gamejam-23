class Robot extends Entity {
  static get STATES() {
    return {
      ROAMING: "roaming",
      ATTACKING: "attacking",
      REPAIRING: "repairing",
    };
  }

  static get STATE_OUTPUT() {
    return {
      default: "🤖",
      attacking: "‼️",
      repairing: "🛠️",
    };
  }

  constructor(position) {
    super(position);
    this.position = position;
    this.moveCommands = [];
    this.acceleration = null;
    this.lastMove = Date.now();
    this.health = STATICS.robot.HP;
    this.maxHealth = STATICS.robot.HP;
    this.state = Robot.STATES.ROAMING;
    this.drag = 0.75;
    this.failedToFind = 0;
    this.lastScan = Date.now();
    this.showRays = true;
    this.lastSeen = null;
    this.lastSound = null;
  }

  get attackRange() {
    return remap(Math.max(this.health, 1), 1, this.maxHealth, 10, 30) + this.size / 2;
  }

  get damage() {
    return remap(Math.max(this.health, 1), 1, this.maxHealth, 1, STATICS.robot.maxDamage);
  }

  render() {
    super.render();
    if (this.dead) return;
    push();
    if (Robot.STATE_OUTPUT[this.state]) {
      textSize(16);
      textAlign(CENTER, CENTER);
      text(Robot.STATE_OUTPUT[this.state], this.position.x, this.position.y - 36);
    }
    if (images.robot && this.angle !== undefined) {
      translate(this.position.x, this.position.y);
      rotate(this.angle);
      imageMode(CENTER);
      image(images.robot, 0, 0, this.size, this.size);
    } else {
      fill(0, 0, 255);
      circle(this.position.x, this.position.y, 10);
    }
    pop();
    if (this.showRays && this.rays) {
      for (const ray of this.rays) {
        ray.show();
      }
    }
    if (this.lastSeen) {
      push();
      stroke(255, 0, 0, 20);
      line(this.position.x, this.position.y, this.lastSeen.x, this.lastSeen.y);
      pop();
    }
  }

  move(vector) {
    super.move(vector);
    this.lastMove = Date.now();
  }

  autoMove() {
    const moveStep = Math.min(width, height) * 0.2;
    const vector = createVector(random(-moveStep, moveStep), random(-moveStep, moveStep));
    this.move(vector);
  }

  // raycast along the direction of movement in a cone for the player
  lookForPlayer() {
    let canSeePlayer = false,
      point = null;
    for (const ray of this.rays) {
      const hit = ray.cast(GameState.instance.player);
      if (hit) {
        canSeePlayer = true;
        point = hit;
        break;
      }
    }
    if (canSeePlayer) {
      this.state = Robot.STATES.ATTACKING;
      this.lastSeen = point.copy();
      this.playSound("robot");
      this.failedToFind = 0;
    } else {
      this.failedToFind++;
      this.lastSeen = null;
      if (this.failedToFind > STATICS.robot.maxFailedToFind) {
        this.state = Robot.STATES.ROAMING;
        this.failedToFind = 0;
      }
    }
    this.lastScan = Date.now();
  }

  doMovement() {
    super.doMovement();
    this.rays = [];
    for (let i = 0; i < 4; i++) {
      const angle = this.angle + (i - 2) * 0.35;
      const ray = new Ray(this.position, angle);
      this.rays.push(ray);
    }
  }

  update() {
    if (!super.update()) return false;
    if (this.state === Robot.STATES.ROAMING && this.health < this.maxHealth / 2) {
      this.state = Robot.STATES.REPAIRING;
    } else if (this.state === Robot.STATES.REPAIRING && this.health >= this.maxHealth * 0.85) {
      this.state = Robot.STATES.ROAMING;
      this.maxHealth = this.maxHealth * 0.85
    }
    switch (this.state) {
      case Robot.STATES.ROAMING:
        if (Date.now() - this.lastMove > STATICS.robot.autoMoveDelay && this.state === Robot.STATES.ROAMING) {
          this.autoMove();
        }
        const vector = createVector(0, 0);
        const moves = this.moveCommands.splice(0, 3);
        if (moves.length > 0) {
          for (const moveCommand of moves) {
            vector.add(createVector(moveCommand.x, moveCommand.y));
          }
          vector.div(moves.length);
          this.acceleration.add(vector);
        }
        this.doMovement();
        if (Date.now() - this.lastScan > STATICS.robot.scanDelay) {
          this.lookForPlayer();
        }
        break;
      case Robot.STATES.REPAIRING:
        if (!this.lastRepair || Date.now() - this.lastRepair > 1000) {
          this.health += STATICS.robot.repairRate;
          this.health = Math.min(this.health, this.maxHealth);
          this.lastRepair = Date.now();
        }
        break;
      case Robot.STATES.ATTACKING:
        const player = GameState.instance.player;
        if (player && !player.dead) {
          if (this.lastSeen && this.position.dist(this.lastSeen) < this.attackRange) {
            if (this.position.dist(player.position)  <= this.attackRange + player.size && (!this.lastAttack || Date.now() - this.lastAttack > STATICS.robot.attackRate)) {
              gameState.playSound("robotAttack");
              this.lastAttack = Date.now();
              player.takeDamage(this.damage);
            } else {
              if (Date.now() - this.lastScan > STATICS.robot.scanDelay) {
                this.lookForPlayer();
                this.move(this.position.copy().sub(player.position).normalize());
              }
            }
          } else {
            if (this.lastSeen) {
              this.steer(this.lastSeen.copy().sub(this.position).normalize());
            }
            this.doMovement();
            if (Date.now() - this.lastScan > STATICS.robot.scanDelay) {
              this.lookForPlayer();
            }
          }
        } else {
          this.state = Robot.STATES.ROAMING;
        }
        break;
    }

    this.keepInBounds();
  }
}
