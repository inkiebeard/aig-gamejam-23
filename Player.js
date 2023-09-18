class Player extends Entity {
  constructor(position) {
    super(position);
    this.inventory = {
      throwable: {
        quantity: 3,
      },
    };
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

  use() {
    if (this.dead) return;
    for(const gObj of this.GS.gameObjects) {
      if (checkVectorsInDist(this.position, gObj.position, this.size / 2 + gObj.size / 2)) {
        if (gObj.hasGem) {
          this.addInventory({ name: "gem", quantity: 1 });
          gObj.hasGem = false;
          this.playSound('bleep1')
        } else if (!gObj.searched) {
          this.addInventory({ name: random() > 0.5 ? "health" : "throwable", quantity: 1 });
          gObj.searched = false;
          this.playSound('bleep1')
        }
        break;
      }
      this.playSound('ding')
    }
  }
  attack() {
    if (this.dead) return;
    if (!this.inventory.throwable || this.inventory.throwable.quantity <= 0) return;
    this.inventory.throwable.quantity--;
    this.GS.gameObjects.push(new Thrower(this.position.copy(), this.angle));
    this.playSound('woosh1')
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

    // inventory
    let types = 0;
    for (const [index, item] of Object.entries(this.inventory)) {
      types++;
      push();
      fill(0);
      textSize(16);
      textAlign(RIGHT, CENTER);
      text(index +": "+item.quantity, width - 5, 32 * types + 16);
      pop();
    }
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
