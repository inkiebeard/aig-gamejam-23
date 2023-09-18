class Crate {
  constructor({ x, y }, size = 50) {
    this.position = { x, y };
    this.size = size;
    this.color = "brown";
    this.health = 100;
    this.maxHealth = 100;
  }

  get dead() {
    return this.health <= 0;
  }

  update() {
    if (this.position.dist === undefined) {
      this.position = createVector(this.position.x, this.position.y);
    }
    return;
  }

  collide(obj) {
   // not implemented
  }

  render() {
    if (this.dead) return;
    push();
    if (images.crate) {
      imageMode(CENTER);
      image(images.crate, this.position.x, this.position.y, this.size, this.size);
    } else {
      fill(this.color);
      rect(this.position.x, this.position.y, this.size, this.size);
    }
    pop();
  }
}
