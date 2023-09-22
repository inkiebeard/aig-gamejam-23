class Robot extends AutoAgent {
  static get STATES() {
    return {
      ROAMING: "roaming",
      ATTACKING: "attacking",
      REPAIRING: "repairing",
      ALERT: "alert",
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
    this.showRays = false;
    this.lastSeen = null;
    this.lastSound = null;
    this.speed = STATICS.robot.speed;
    this.lastAlerted = null;
    this.investigated = [];
    this._state = Robot.STATES.ROAMING;
  }

  get state() {
    return this._state;
  }

  set state(state) {
    this._state = state;
    switch (state) {
      case Robot.STATES.ROAMING:
        this.GS.addNotify("-.-", this.position, "ding");
        break;
      case Robot.STATES.ALERT:
        this.GS.addNotify("‼️", this.position.copy(), "robot");
        break;
      case Robot.STATES.ATTACKING:
        this.GS.addNotify("🚨", this.position.copy(), "robot");
        break;
    }
  }

  get attackRange() {
    return remap(Math.max(this.health, 1), 1, this.maxHealth, 10, 30) + this.size / 2;
  }

  get damage() {
    return remap(Math.max(this.health, 1), 1, this.maxHealth, 1, STATICS.robot.maxDamage);
  }

  render() {
    super.render();
    if (this.dead) {
      push();
      fill(255, 0, 0);
      textSize(16);
      textAlign(CENTER, CENTER);
      text("🔩", this.position.x, this.position.y - 10);
      text("⚙️", this.position.x - 10, this.position.y + 10);
      pop();
      return;
    }
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
      stroke(255, 0, 0, 40);
      line(this.position.x, this.position.y, this.lastSeen.x, this.lastSeen.y);
      pop();
    }

    if (this.state === Robot.STATES.ALERT) {
      push();
      fill(255, 255, 50, 30);
      noStroke();
      circle(this.position.x, this.position.y, STATICS.robot.viewDistance);
      fill(0);
      textSize(16);
      textAlign(CENTER, CENTER);
      text("‼️", this.position.x, this.position.y - 10);
      pop();
    }
  }

  move(vector) {
    super.move(vector);
    this.lastMove = Date.now();
  }

  autoMove() {
    if (this.target === null) {
      this.target = createVector(random(0, STATICS.width), random(0, STATICS.height));
    }
  }
  takeDamage(damage) {
    super.takeDamage(damage);
    if (this.state !== Robot.STATES.ATTACKING) {
      this.state = Robot.STATES.ALERT;
      this.lastAlerted = Date.now();
      this.target =
        this.position.dist(this.GS.player.position) > STATICS.robot.viewDistance
          ? this.GS.player.position.copy()
          : p5.Vector.sub(this.position, this.GS.player.position).normalize().setMag(5);
    }
  }

  // raycast along the direction of movement in a cone for the player
  lookForPlayer() {
    let canSeePlayer = false,
      point = null;
    for (const ray of this.rays) {
      const hit = ray.cast(this.GS.player);
      if (hit) {
        canSeePlayer = true;
        point = hit;
        break;
      }
    }
    const playerInFront =
      this.angle > this.position.copy().sub(this.GS.player.position).heading() - 0.5 && this.angle < this.position.copy().sub(this.GS.player.position).heading() + 0.5;
    if (canSeePlayer || (playerInFront && this.position.dist(this.GS.player.position) < STATICS.robot.viewDistance)) {
      this.state = Robot.STATES.ATTACKING;
      this.lastSeen = point ? point.copy() : this.GS.player.position.copy();
      this.failedToFind = 0;
    } else {
      this.failedToFind++;
      if (this.failedToFind > (this.state === Robot.STATES.ALERT ? 10 : 1) * STATICS.robot.maxFailedToFind) {
        const hadLastSeen = this.lastSeen !== null;
        this.lastSeen = null;
        if (![Robot.STATES.ROAMING, Robot.STATES.ALERT].includes(this.state)) {
          this.state = Robot.STATES.ROAMING;
        }
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
      this.maxHealth = this.maxHealth * 0.85;
    }

    const player = this.GS.player;
    switch (this.state) {
      case Robot.STATES.ROAMING:
        const moves = this.moveCommands.splice(0, 3);
        if (moves.length > 0) {
          this.target = null;
          for (const moveCommand of moves) {
            this.steer(moveCommand);
          }
        }
        if (moves.length === 0 && Date.now() - this.lastMove > STATICS.robot.autoMoveDelay && this.state === Robot.STATES.ROAMING) {
          this.autoMove();
        }
        this.doMovement(moves.length > 0);
        if (Date.now() - this.lastScan > STATICS.robot.scanDelay) {
          this.lookForPlayer();
          if (!this.lastSeen) {
            const crates = this.GS.gameObjects.filter((go) => go instanceof Crate && go.position.dist(this.position) < STATICS.robot.viewDistance);
            const searched = crates.find((c) => c.searched && !this.investigated.includes(c));
            if (searched) {
              this.investigated.push(searched);
              this.state = Robot.STATES.ALERT;
              this.lastAlerted = Date.now();
              this.target = searched.position.copy();
              return;
            }
            const attackers = this.GS.gameObjects.filter(
              (go) => go instanceof Robot && go.state === Robot.STATES.ATTACKING && go.position.dist(this.position) < STATICS.robot.viewDistance
            );
            if (attackers.length > 0) {
              this.state = Robot.STATES.ALERT;
              this.lastAlerted = Date.now();
              this.target = attackers[0].position.copy();
              return;
            }
          }
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
        if (player && !player.dead) {
          if (this.lastSeen && this.position.dist(this.lastSeen) < this.attackRange) {
            if (this.position.dist(player.position) <= this.attackRange + player.size && (!this.lastAttack || Date.now() - this.lastAttack > STATICS.robot.attackRate)) {
              gameState.playSound("robotAttack");
              this.lastAttack = Date.now();
              player.takeDamage(this.damage);
            } else {
              if (Date.now() - this.lastScan > STATICS.robot.scanDelay * 0.5) {
                this.target = this.lastSeen.copy();
                this.lookForPlayer();
              }
            }
            this.doMovement();
          } else {
            if (this.lastSeen) {
              this.target = this.lastSeen.copy();
            }
            this.doMovement();
          }
        } else {
          this.state = Robot.STATES.ROAMING;
        }
        break;
      case Robot.STATES.ALERT:
        this.doMovement();
        if (player && !player.dead) {
          if (this.target && this.position.dist(this.target) < this.attackRange) {
            this.lookAt(player.position);
            if (Date.now() - this.lastScan > STATICS.robot.scanDelay * 0.5) {
              this.lookForPlayer();
            }
          } else {
            if (Date.now() - this.lastScan > STATICS.robot.scanDelay * 0.5) {
              this.lookForPlayer();
            }
            if (this.target && this.position.dist(this.target) < this.attackRange) {
              if (!this.lastSeen && Date.now() - this.lastAlerted > STATICS.robot.alertTime) {
                this.state = Robot.STATES.ROAMING;
              }
            } else {
              if (Date.now() - this.lastAlerted > STATICS.robot.alertTime) {
                this.state = Robot.STATES.ROAMING;
              }
            }
          }
        }
        break;
    }

    this.keepInBounds();
  }
}
