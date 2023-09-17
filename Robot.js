class Robot {
  constructor(position) {
    this.position = position;
    this.moveCommands = [];
    this.acceleration = null;
  }

  render() {
    push();
    fill(0, 255, 0);
    if (images.robot && this.angle !== undefined) {
      translate(this.position.x, this.position.y);
      rotate(this.angle)
      imageMode(CENTER);
      image(images.robot, 0, 0, 32, 32);
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
    const moves = this.moveCommands.splice(0, 3);
    if (moves.length > 0) {
      for (const moveCommand of moves) {
        vector.add(createVector(moveCommand.x, moveCommand.y));
      }
      vector.div(moves.length);
      this.acceleration.add(vector);
    }
    this.acceleration.limit(STATICS.playerSpeed);
    this.acceleration.mult(0.75);
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