class Thrower {
  constructor(position, angle, isBoss = false) {
    this.position = position;
    this.angle = angle;
    this.size = 5;
    this.speed = 10;
    this.damage = 2;
    this.lifeTime = isBoss ? 5000 : 1000;
    this.createdAt = Date.now();
    this.color = "grey";
    this.dead = false;
    this.collisions = true;
    this.isBoss = isBoss;
  }

  get GS() {
    return new GameState();
  }

  collide(obj) {
    // not implemented
  }

  get displayAngle() {
    return !this.isBoss ? this.angle : this.angle + Math.PI / 2;
  }

  update() {
    if (Date.now() - this.createdAt > this.lifeTime) {
      this.dead = true;
      this.GS.removeGameObject(this);
      return
    }
    this.position.add(createVector(this.speed * Math.cos(this.angle), this.speed * Math.sin(this.angle)));
    if (this.isBoss) {
      if (this.GS.checkOverlap(this, this.GS.player)) {
        this.GS.player.takeDamage(this.damage * this.speed);
        this.dead = true;
        this.GS.removeGameObject(this);
        return
      }
      return
    }
    
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
    
    translate(this.position.x, this.position.y);
    rotate(this.displayAngle)
    image(!this.isBoss ? images.knife : images.crate, 0, 0, 32, 32);
    pop();
  }
}
