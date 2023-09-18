class Player extends Entity {
  constructor(position) {
    super(position);
    this.inventory = {};
    this.position = position;
    this.moveCommands = [];
    this.acceleration = null;
    this.health = STATICS.player.HP;
    this.maxHealth = STATICS.player.HP;
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
    super.render();
    if (this.dead) return;
    push();
    fill(255, 0, 0);
    if (images.player && this.angle !== undefined) {
      translate(this.position.x, this.position.y);
      rotate(this.angle);
      imageMode(CENTER);
      image(images.player, 0, 0, this.size, this.size);
    } else {
      circle(this.position.x, this.position.y, 10);
    }
    pop();
  }

  update() {
    if (!super.update()) return false;
   
    const vector = createVector(0, 0);
    const moves = this.moveCommands.splice(0, 5);
    if (moves.length > 0) {
      for (const moveCommand of moves) {
        vector.add(createVector(moveCommand.x, moveCommand.y));
      }
      vector.div(moves.length);
      this.acceleration.add(vector);
    }
    this.doMovement();
  }
}
