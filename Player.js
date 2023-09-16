class Player {
  constructor(position) {
    this.inventory = {};
    this.position = position;
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
    circle(this.position.x, this.position.y, 10);
    pop();
  }

  move(vector) {
    this.position.x += vector.x;
    this.position.y += vector.y;
  }
}
