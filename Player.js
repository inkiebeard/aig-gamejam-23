class Player {
  constructor(position) {
    this.inventory = {};
    this.position = position;
    this.moveCommands = [];
    this.acceleration = null;
  }

  addInventory(item) {
    if (this.inventory[item.name]) {
      this.inventory[item.name].quantity += item.quantity;
    } else {
      this.inventory[item.name] = item;
    }
  }

  removeInventory(item) {
    if (this.inventory[item.name]) {
      this.inventory[item.name].quantity -= item.quantity;
    }
  }

  render() {
    push();
    fill(255, 0, 0);
    if (images.player && this.angle !== undefined) {
      translate(this.position.x, this.position.y);
      rotate(this.angle)
      imageMode(CENTER);
      image(images.player, 0, 0, 32, 32);
    } else {
      circle(this.position.x, this.position.y, 10);
    }
    pop();
  }

  move(vector) {
    this.moveCommands.push(vector);
  }

  update() {
    if (this.acceleration === null) {
      this.acceleration = createVector(0, 0);
      this.position = createVector(this.position.x, this.position.y);
    }
    const vector = createVector(0, 0);
    const moves = this.moveCommands.splice(0, 5);
    if (moves.length > 0) {
      for (const moveCommand of moves) {
        vector.add(createVector(moveCommand.x, moveCommand.y));
      }
      vector.div(moves.length);
      this.acceleration.add(vector);
    }
    this.acceleration.limit(STATICS.playerSpeed);
    this.acceleration.mult(0.9);
    this.angle = this.acceleration.heading();
    this.position.add(this.acceleration);
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
}
