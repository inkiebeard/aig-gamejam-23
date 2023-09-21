const InventoryIconMap = {
  gem: '💎',
  throwable: '🗡️',
  health: '🏥'
}

class Player extends AutoAgent {
  constructor(position) {
    super(position);
    this.inventory = {
      throwable: {
        quantity: 3,
      },
      health: { quantity: 1 },
      gem: { quantity: 0 },
    };
    this.position = position;
    this.moveCommands = [];
    this.acceleration = null;
    this.health = STATICS.player.HP;
    this.maxHealth = STATICS.player.HP;
    this.angle = 0
    this.speed = STATICS.player.speed;
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

  useObject(gObj) {
    if (checkVectorsInDist(this.position, gObj.position, this.size + gObj.size / 2 + 2) && gObj.searched !== true) {
      if (gObj.hasGem) {
        this.addInventory({ name: "gem", quantity: 1 });
        gObj.hasGem = false;
        gObj.searched = false;
        this.GS.addNotify("💎", this.position.copy(),'pickup', 1500, 32, 0);
        return true
      } else if (!gObj.searched) {
        const type = random() > 0.2 ? "health" : "throwable"
        this.addInventory({ name: type, quantity: 1 });
        gObj.searched = true;
        this.GS.addNotify(InventoryIconMap[type], this.position.copy(),'gem', 1500, 20, 0);
        return true
      }
      this.playSound('ding')
      useHealth = false;
    }
    return false
  }

  use() {
    if (this.dead) return;
    let useHealth = true;
    for(const gObj of this.GS.gameObjects) {
      if (gObj instanceof Crate) {
        const searched = this.useObject(gObj);
        if (searched) {
          useHealth = false;
          break;
        }
      }
    }
    if (useHealth && this.inventory.health && this.inventory.health.quantity > 0 && this.health < this.maxHealth) {
      this.health += 5;
      this.inventory.health.quantity--;
      this.playSound('bleep1')
      this.health = Math.min(this.health, this.maxHealth);
    }
  }
  attack(angle = this.angle) {
    if (this.dead) return;
    if (!this.inventory.throwable || this.inventory.throwable.quantity <= 0) return;
    this.inventory.throwable.quantity--;
    this.GS.gameObjects.push(new Thrower(this.position.copy(), angle));
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
      push();
      fill(0);
      textSize(16);
      textAlign(CENTER, CENTER);
      text(InventoryIconMap[index] +" "+item.quantity, width / 2 - (48 * types) + 28, height * 0.95);
      pop();
      types++;
    }
  }

  update() {
    if (!super.update()) return false;
   
    const moves = this.moveCommands.splice(0, 5);
    if (moves.length > 0) {
      for (const moveCommand of moves) {
        this.steer(moveCommand);
      }
    }
    this.doMovement(moves.length > 0);
  }
}
