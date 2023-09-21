const STATES = {
  PLAYING: "playing",
  READY: "ready",
  PAUSED: "paused",
  GAME_OVER: "game_over",
  GAME_START: "game_start",
  LEVEL_WON: "level_won",
};

const ObjectTypes = {
  crate: Crate,
  robot: Robot,
  player: Player,
};

const STATICS = {
  tickRate: 1000 / 128,
  defaultFixedRate: 1000 / 60,
  get fixedRate() {
    try {
      return 1000 / (frameRate !== undefined ? frameRate() : 60);
    } catch (e) {
      return STATICS.defaultFixedRate;
    }
  },
  get width() {
    return Math.min(1200, window.innerWidth);
  },
  get height() {
    return Math.min(800, window.innerHeight);
  },
  get halfWidth() {
    return STATICS.width / 2;
  },
  get halfHeight() {
    return STATICS.height / 2;
  },
  player: {
    speed: 1,
    HP: 100,
  },
  entities: {
    drag: 0.65,
    speed: 1,
  },
  robot: {
    speed: 0.3,
    autoMoveDelay: 1000,
    attackRate: 0.7,
    HP: 30,
    repairRate: 1.5 * (1000 / 128),
    viewDistance: 160,
    maxFailedToFind: 3,
    scanDelay: 1000,
    attackRate: 800,
    maxDamage: 3,
    alertTime: 1800,
  },
};

const keyControllers = {
  " ": () => {
    if (!GameState.instance.views.menu.classList.contains("hidden")) {
      GameState.instance.mainPressed();
    } else {
      GameState.instance.isPlaying && GameState.instance.player.attack();
    }
  },
  Escape: () => {
    GameState.instance.toggleMenu();
    if (GameState.instance.views.menu.classList.contains("hidden") && GameState.instance.currentState === STATES.PAUSED) {
      GameState.instance.currentState = STATES.PLAYING;
    } else if (!GameState.instance.views.menu.classList.contains("hidden") && GameState.instance.currentState === STATES.PLAYING) {
      GameState.instance.currentState = STATES.PAUSED;
    }
  },
  Enter: () => !GameState.instance.views.menu.classList.contains("hidden") && GameState.instance.mainPressed(),
  ArrowUp: () => {
    GameState.instance.isPlaying && GameState.instance.addMoveCommand({ x: 0, y: -STATICS.player.speed });
  },
  ArrowDown: () => {
    GameState.instance.isPlaying && GameState.instance.addMoveCommand({ x: 0, y: STATICS.player.speed });
  },
  ArrowLeft: () => {
    GameState.instance.isPlaying && GameState.instance.addMoveCommand({ x: -STATICS.player.speed, y: 0 });
  },
  ArrowRight: () => {
    GameState.instance.isPlaying && GameState.instance.addMoveCommand({ x: STATICS.player.speed, y: 0 });
  },
  w: () => {
    GameState.instance.isPlaying && GameState.instance.addMoveCommand({ x: 0, y: -STATICS.player.speed });
  },
  s: () => {
    GameState.instance.isPlaying && GameState.instance.addMoveCommand({ x: 0, y: STATICS.player.speed });
  },
  a: () => {
    GameState.instance.isPlaying && GameState.instance.addMoveCommand({ x: -STATICS.player.speed, y: 0 });
  },
  d: () => {
    GameState.instance.isPlaying && GameState.instance.addMoveCommand({ x: STATICS.player.speed, y: 0 });
  },
  e: () => {
    GameState.instance.isPlaying && GameState.instance.player.use();
  },
};

class GameState {
  /**
   * GameState holds all the data for the game and controls updates for all objects
   * @param {any} options
   */
  constructor(options = {}) {
    if (GameState.instance) {
      return GameState.instance;
    }
    GameState.instance = this;
    Object.keys(options).map((key) => {
      this[key] = options[key];
    });
    this.buttons = {
      main: document.getElementById("mainAction"),
      reset: document.getElementById("resetAction"),
      music: document.getElementById("musicAction"),
    };
    this.views = {
      menu: document.getElementById("menu"),
      credits: document.getElementById("credits"),
      gameover: document.getElementById("gameover"),
      loading: document.getElementById("loading"),
    };
    this.init();
    this._state = STATES.GAME_START;
    this.startTime = null;
    this.endTime = null;
    this.playedSounds = [];
  }

  get isPlaying() {
    return this.currentState === STATES.PLAYING;
  }

  get soundsReady() {
    return Object.keys(sounds).length > 0;
  }

  get imagesReady() {
    return Object.keys(images).length > 0;
  }

  get currentState() {
    return this._state;
  }

  set currentState(state) {
    this._state = state;
    switch (state) {
      case STATES.READY:
        this.views.loading.classList.add("hidden");
        this.views.menu.classList.remove("hidden");
        this.buttons.main.textContent = "Play";
        break;
      case STATES.PAUSED:
        this.buttons.main.textContent = "Resume";
        this.stopTicks();
        break;
      case STATES.GAME_OVER:
        this.playMusic && sounds.music.stop();
        this.endTime = Date.now();
        this.views.gameover.textContent = "Game Over: you lasted " + humanReadableTime(this.endTime - this.startTime);
        this.views.gameover.classList.remove("hidden");
        this.views.menu.classList.remove("hidden");
        this.buttons.main.textContent = "Start Over";
        this.stopTicks();
        break;
      case STATES.GAME_START:
        this.views.loading.classList.add("hidden");
        this.views.menu.classList.remove("hidden");
        this.buttons.main.textContent = "Start";
        this.stopTicks();
        break;
      case STATES.LEVEL_WON:
        this.views.menu.classList.remove("hidden");
        this.buttons.main.textContent = "Next Level";
        this.stopTicks();
        this.endTime = Date.now();
        this.views.gameover.textContent = "Level Complete: completed in " + humanReadableTime(this.endTime - this.startTime);
        this.views.gameover.classList.remove("hidden");
        break;
      case STATES.PLAYING:
        if (this.playMusic && !sounds.music.isPlaying()) {
          sounds.music.loop();
        }
        if (this.startTime === null) {
          this.startTime = Date.now();
        }
        this.views.menu.classList.add("hidden");
        this.buttons.main.textContent = "Pause";
        this.startTicks();
        break;
      default:
        console.log("unhandled state", state);
        break;
    }
  }

  removeGameObject(gameObject) {
    if (gameObject instanceof Notify) {
      this.notifies = this.notifies.filter((v) => v !== gameObject);
    } else if (gameObject instanceof AutoAgent) {
      this.entities = this.entities.filter((v) => v !== gameObject);
    } else {
      this.gameObjects = this.gameObjects.filter((v) => v !== gameObject);
    }
  }

  playSound(sound) {
    if (this.soundsReady && sounds[sound] && this.playedSounds.length <= 10) {
      sounds[sound].play();
      sound !== "music" && this.playedSounds.push(sound);
      if (this.playedSounds.length >= 9) {
        sounds[this.playedSounds.shift()].stopAll();
      }
      setTimeout(() => {
        this.playedSounds = this.playedSounds.filter((v) => v !== sound);
      }, sounds[sound].duration() * 1000);
    }
  }

  addMoveCommand(vector) {
    this.player.move(vector);
    this.entities.forEach((entity) => {
      if (entity instanceof Robot) {
        entity.move(vector);
      }
    });
  }

  loadPreviousSaved() {
    try {
      const saved = localStorage.getItem("beardo_games_warehouseCaper");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.level = parsed.level;
        this.playMusic = parsed.playMusic;
        this.buttons.music.textContent = this.playMusic ? "Music: On" : "Music: Off";
      } else {
        this.level = 1;
        this.playMusic = true;
        this.buttons.music.textContent = "Music: On";
      }
    } catch (e) {
      console.log("error loading saved game", e);
    }
  }

  saveToStorage() {
    try {
      const { level, playMusic } = this;
      localStorage.setItem("beardo_games_warehouseCaper", JSON.stringify({ level, playMusic }));
    } catch (e) {
      console.log("error saving game", e);
    }
  }

  init() {
    this.loadPreviousSaved();
    this.currentState = STATES.GAME_START;
    document.addEventListener("keydown", (e) => {
      if (keyControllers.hasOwnProperty(e.key)) {
        keyControllers[e.key]();
      } else {
        console.log("key press", e.key, "not handled");
      }
    });

    this.buttons.main.addEventListener("click", () => this.mainPressed());
    this.buttons.reset.addEventListener("click", () => {
      this.playSound("pop");
      this.setup();
    });
    this.buttons.music.addEventListener("click", () => {
      this.playSound("pop");
      this.playMusic = !this.playMusic;
      this.buttons.music.textContent = this.playMusic ? "Music: On" : "Music: Off";
      if (this.playMusic && this.currentState === STATES.PLAYING && !sounds.music.isPlaying()) {
        sounds.music.loop();
      } else if (sounds.music.isPlaying()) {
        sounds.music.stop();
      }
    });

    setTimeout(() => this.setup(), 200);
  }

  startTicks() {
    this.tickInterval = setInterval(() => this.tick(), STATICS.tickRate);
  }

  stopTicks() {
    clearInterval(this.tickInterval);
  }

  mainPressed() {
    // main button pressed
    switch (this.currentState) {
      case STATES.READY:
        this.views.menu.classList.remove("hidden");
      case STATES.PAUSED:
      case STATES.GAME_START:
        this.currentState = STATES.PLAYING;
        break;
      case STATES.GAME_OVER:
        this.setup();
        break;
      case STATES.LEVEL_WON:
        this.level++;
        this.setup(true);
        break;
      case STATES.PLAYING:
      default:
        this.currentState = STATES.PAUSED;
        break;
    }
    this.playSound("pop");
    console.log("current state", this.currentState);
  }

  tick() {
    for (const gameObject of this.gameObjects) {
      gameObject.update();
    }
    for (const entity of this.entities) {
      entity.update();
    }
    for (const notify of this.notifies) {
      notify.update();
    }
    this.player.update();
    // do physics collisions
    [...this.entities, ...this.gameObjects, this.player].forEach((v) => {
      [...this.entities, ...this.gameObjects, this.player].forEach((v2) => {
        if (v !== v2 && v.collisions && v2.collisions && this.checkOverlap(v, v2)) {
          v.collide(v2);
        }
      });
    });

    // check for win condition
    if (this.player.inventory.gem && this.player.inventory.gem.quantity >= Math.min(3, this.level)) {
      this.currentState = STATES.LEVEL_WON;
      this.playSound("phaserUp1");
      this.stopTicks();
    }
    //check for player death
    if (this.player.dead) {
      this.currentState = STATES.GAME_OVER;
      this.buttons.main.textContent = "Game Over";
      this.playSound("gameover");
      this.stopTicks();
    }
  }

  addNotify(text, position = { x: STATICS.halfWidth, y: STATICS.halfHeight }, sound, lifeTime = 2500, size = 16, color = 0) {
    this.notifies.push(new Notify(position, text, sound, lifeTime, size, color));
  }

  checkOverlap(a, b) {
    try {
      return p5.Vector.dist(a.position, b.position) <= a.size / 2 + b.size / 2;
    } catch (e) {
      console.log("error checking overlap", a, b);
      return false;
    }
  }

  fixedUpdate() {
    // called per frame
    this.render();
    this.saveToStorage();
  }

  async setup(autoplay = false) {
    this.views.loading.classList.remove("hidden");
    this.currentState = STATES.GAME_START;
    this.views.gameover.classList.add("hidden");
    // setup game
    this.startTime = null;
    this.endTime = null;
    this.entities = [];
    this.gameObjects = [];
    this.notifies = [];
    this.player = new Player({ x: randomRange(0, STATICS.width * 0.3), y: randomRange(0, STATICS.height) });
    for (let i = 0; i < this.level; i++) {
      let position = { x: randomRange(STATICS.width * 0.3, STATICS.width), y: randomRange(0, STATICS.height) };
      const started = Date.now();
      while (checkVectorsInDist(position, this.player.position, 50) && Date.now() - started < 200) {
        position = { x: randomRange(STATICS.width * 0.3, STATICS.width), y: randomRange(0, STATICS.height) };
      }
      this.entities.push(new Robot(position));
    }
    for (let i = 0; i < Math.min(this.level * 5, 30); i++) {
      this.spawnNoOverlap();
    }
    setTimeout(() => {
      this.checkFinishedPlacing(autoplay);
    }, 10);
  }

  checkFinishedPlacing(autoplay) {
    if (this.gameObjects.length < Math.min(this.level * 5, 30)) {
      setTimeout(() => {
        this.checkFinishedPlacing(autoplay);
      }, 10);
    } else {
      const gems = this.gameObjects.filter((v) => v instanceof Crate).filter((v) => v.hasGem);
      if (gems.length < Math.min(3, this.level)) {
        for (let i = gems.length; i < Math.min(3, this.level); i++) {
          const crate = this.gameObjects.find((v) => v instanceof Crate && !v.hasGem);
          crate.hasGem = true;
        }
      } else if (gems.length > Math.min(3, this.level)) {
        for (let i = Math.min(3, this.level); i < gems.length; i++) {
          const crate = this.gameObjects.find((v) => v instanceof Crate && v.hasGem);
          crate.hasGem = false;
        }
      }
      this.currentState = autoplay ? STATES.PLAYING : STATES.READY;
    }
  }

  async spawnNoOverlap() {
    let position = { x: randomRange(0, STATICS.width), y: randomRange(0, STATICS.height) };
    let attempts = 0;
    const tryCreation = () => {
      if ([...this.entities, ...this.gameObjects, this.player].some((obj) => checkVectorsInDist(position, obj.position, obj.size + 10)) && attempts < 100) {
        position = { x: randomRange(0, STATICS.width), y: randomRange(0, STATICS.height) };
        attempts++;
        setTimeout(tryCreation, 10);
      } else {
        let size = randomRange(20, 50);
        const crate = new Crate(position, size);
        crate.hasGem = random() > 0.2;
        this.gameObjects.push(crate);
      }
    };
    tryCreation();
  }

  toggleMenu() {
    if (this.views.menu.classList.contains("hidden")) {
      this.views.menu.classList.remove("hidden");
    } else if (!this.views.menu.classList.contains("hidden") && ![STATES.READY, STATES.GAME_OVER, STATES.GAME_START].includes(this.currentState)) {
      this.views.menu.classList.add("hidden");
    }
    this.playSound("pop");
  }

  render() {
    // render all game objects
    for (const gameObject of this.gameObjects) {
      gameObject.render();
    }
    for (const entity of this.entities) {
      entity.render();
    }
    this.player.render();
    for (const notify of this.notifies) {
      notify.render();
    }
    if (this.currentState === STATES.PLAYING) {
      push();
      fill(0);
      textAlign(LEFT, TOP);
      text("Level: " + this.level, 10, 20);
      text("Time: " + humanReadableTime(Date.now() - this.startTime), 10, 40);
      pop();
    }
  }

  mousePressed(x, y) {
    if (this.views.menu.classList.contains("hidden")) {
      const mousePos = createVector(x, y);
      for (const gameObject of this.gameObjects) {
        if (checkVectorsInDist(mousePos, gameObject.position, gameObject.size / 2)) {
          if (this.player.position.dist(gameObject.position) <= this.player.size / 2 + gameObject.size / 2 + 2) {
            this.player.useObject(gameObject);
            return;
          } else {
            this.player.target = gameObject.position.copy();
          }
        }
      }
      for (const entity of this.entities) {
        if (checkVectorsInDist(mousePos, entity.position, entity.size / 2)) {
          if (this.player.position.dist(entity.position) <= this.player.size / 2 + entity.size / 2 + 2 && entity.dead) {
            this.player.useObject(entity);
            return;
          } else {
            this.player.attack(entity.position.copy().sub(this.player.position).heading());
            return;
          }
        }
      }
      this.player.target = mousePos;
      const direction = mousePos.copy().sub(this.player.position);
      for (const entity of this.entities) {
        entity.target = random() > 0.3 ? entity.position.copy().sub(direction) : entity.position.copy().add(direction);
      }
    }
  }
}
