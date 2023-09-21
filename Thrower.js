class Thrower {
  constructor(position, angle) {
    this.position = position;
    this.angle = angle;
    this.size = 5;
    this.speed = 10;
    this.damage = 2;
    this.lifeTime = 1000;
    this.createdAt = Date.now();
    this.color = "grey";
    this.dead = false;
    this.collisions = true;
  }

  get GS() {
    return new GameState();
  }

  collide(obj) {
    // not implemented
  }

  update() {
    if (Date.now() - this.createdAt > this.lifeTime) {
      this.dead = true;
      this.GS.removeGameObject(this);
      return
    }
    this.position.add(createVector(this.speed * Math.cos(this.angle), this.speed * Math.sin(this.angle)));
    this.speed *= 0.99;
    for(const ent of this.GS.entities) {
      if (this.GS.checkOverlap(this, ent)) {
        ent.takeDamage(this.damage * this.speed);
        this.dead = true;
        this.GS.removeGameObject(this);
        return
      }
    }
    return true;
  }

  render() {
    push();
    imageMode(CENTER);
    translate(this.position.x, this.position.y);
    rotate(this.angle)
    image(images.knife, 0, 0, 32, 32);
    pop();
  }
}
