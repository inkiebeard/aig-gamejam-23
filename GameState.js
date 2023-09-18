const STATES = {
  PLAYING: "playing",
  READY: "ready",
  PAUSED: "paused",
  GAME_OVER: "game_over",
  GAME_START: "game_start",
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
  player: {
    speed: 5,
    HP: 100,
  },
  entities: {
    drag: 0.85,
  },
  robot: {
    speed: 3,
    autoMoveDelay: 1000,
    attackRate: 0.7,
    HP: 30,
    repairRate: 1.5 * (1000 / 128),
    viewDistance: 120,
    maxFailedToFind: 3,
    scanDelay: 1000,
    attackRate: 800,
    maxDamage: 3,
  },
};

const keyControllers = {
  " ": () => !GameState.instance.views.menu.classList.contains("hidden") && GameState.instance.mainPressed(),
  Escape: () => {
    GameState.instance.toggleMenu();
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
    };
    this.views = {
      menu: document.getElementById("menu"),
      credits: document.getElementById("credits"),
      gameover: document.getElementById("gameover"),
    };
    this.init();
    this._state = STATES.GAME_START;
    this.startTime = null;
    this.endTime = null;
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
        this.views.menu.classList.remove("hidden");
        this.buttons.main.textContent = "Play";
        break;
      case STATES.PAUSED:
        this.buttons.main.textContent = "Resume";
        this.stopTicks();
        break;
      case STATES.GAME_OVER:
        sounds.music.stop();
        this.endTime = Date.now();
        const time = humanReadableTime(this.endTime - this.startTime);
        this.views.gameover.textContent = 'Game Over: you lasted ' + time;
        this.views.gameover.classList.remove("hidden");
        this.views.menu.classList.remove("hidden");
        this.currentState = STATES.GAME_START;
        this.buttons.main.textContent = "Start Over";
        this.stopTicks();
        break;
      case STATES.GAME_START:
        this.views.menu.classList.remove("hidden");
        this.buttons.main.textContent = "Start";
        this.stopTicks();
        break;
      case STATES.PLAYING:
        if (!sounds.music.isPlaying()) {
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

  playSound(sound) {
    if (this.soundsReady && sounds[sound]) {
      sounds[sound].play();
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

  init() {
    this.level = 3;
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
      this.playSound("confirm");
      this.setup();
    });

    // this.bindEvents();
    this.setup();
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
    this.player.update();
    // do physics collisions
    [...this.entities, ...this.gameObjects, this.player].forEach((v) => {
      [...this.entities, ...this.gameObjects, this.player].forEach((v2) => {
        if (v !== v2 && this.checkOverlap(v, v2)) {
          v.collide(v2);
          v2.collide(v);
        }
      });
    });

    // check for win condition

    //check for player death
    if (this.player.dead) {
      this.currentState = STATES.GAME_OVER;
      this.buttons.main.textContent = "Game Over";
      this.playSound("gameover");
      this.stopTicks();
    }
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
  }

  setup() {
    // setup game
    this.startTime = null;
    this.endTime = null;
    this.entities = [];
    this.gameObjects = [];
    if (!!canvasReady) {
      this.player = new Player({ x: random(width * 0.3, width * 0.7), y: random(height * 0.3, height * 0.7) });
      for (let i = 0; i < this.level; i++) {
        this.entities.push(new Robot({ x: random(width * 0.2, width * 0.8), y: random(height * 0.2, height * 0.8) }));
      }
      for (let i = 0; i < 10; i++) {
        this.gameObjects.push(new Crate({ x: random(width * 0.2, width * 0.8), y: random(height * 0.2, height * 0.8) }));
      }
    } else {
      this.player = new Player({ x: 100, y: 100 });
      for (let i = 0; i < this.level; i++) {
        this.entities.push(new Robot({ x: Math.random() * window.innerWidth + window.innerWidth * 0.2, y: Math.random() * window.innerHeight + window.innerHeight * 0.2 }));
      }
      for (let i = 0; i < 10; i++) {
        this.gameObjects.push(new Crate({ x: Math.random() * window.innerWidth + window.innerWidth * 0.2, y: Math.random() * window.innerHeight + window.innerHeight * 0.2 }));
      }
    }
    this.currentState = STATES.READY;
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
  }
}
