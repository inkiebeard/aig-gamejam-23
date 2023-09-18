class Crate {
  constructor({ x, y }, size = 50) {
    this.position = { x, y };
    this.size = size;
    this.color = "brown";
    this.health = 100;
    this.maxHealth = 100;
    this.hasGem = false;
    this.searched = false;
  }

  get dead() {
    return this.health <= 0;
  }

  update() {
    if (this.position.dist === undefined) {
      this.position = createVector(this.position.x, this.position.y);
    }
    if (this.dead) return false;
    this.keepInBounds();
    return;
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
    if (this.hasGem) {
      imageMode(CENTER);
      image(images.gem, this.position.x, this.position.y, this.size * 0.5, this.size * 0.5);
    }
    pop();
  }
}
