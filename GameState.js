const STATES = {
  PLAYING: 'playing',
  READY: 'ready',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  GAME_START: 'game_start',
}

const STATICS = {
  tickRate: 1000/128,
  defaultFixedRate: 1000/60,
  get fixedRate() {
    try{
      return 1000/(frameRate !== undefined ? frameRate() : 60)
    } catch(e) {
      return STATICS.defaultFixedRate;
    }
  }
}

const keyControllers = {
  ' ': () => !GameState.instance.views.menu.classList.contains('hidden') && GameState.instance.mainPressed(),
  'Escape': () => {
    GameState.instance.toggleMenu();
  },
  'Enter': () => !GameState.instance.views.menu.classList.contains('hidden') && GameState.instance.mainPressed(),
}

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
      main: document.getElementById('mainAction'),
      reset: document.getElementById('resetAction'),
    }
    this.views = {
      menu: document.getElementById('menu'),
      credits: document.getElementById('credits'),
    }
    this.init();
  }

  init() {
    this.currentState = STATES.GAME_START;
    document.addEventListener('keydown', (e) => {
      if (keyControllers.hasOwnProperty(e.key)) {
        keyControllers[e.key]();
      } else {
        console.log('key press', e.key, 'not handled');
      }
    });
    this.buttons.main.addEventListener('click', () => this.mainPressed());
    this.buttons.reset.addEventListener('click', () => {
      this.setup()
    });
    // this.bindEvents();
    this.setup();
  }

  startTicks() {
    this.tickInterval = setInterval(() => this.tick(), STATICS.tickRate)
    this.fixedInterval = setInterval(() => this.fixedUpdate(), STATICS.fixedRate)
  }

  stopTicks() {
    clearInterval(this.tickInterval);
    clearInterval(this.fixedInterval);
  }

  mainPressed() {
    // main button pressed
    switch(this.currentState) {
      case STATES.READY:
        this.views.menu.classList.remove('hidden');
      case STATES.PAUSED:
        this.currentState = STATES.PLAYING;
        this.buttons.main.textContent = 'Pause';
        this.startTicks();
        break;
      case STATES.GAME_OVER:
        this.currentState = STATES.GAME_START;
        this.buttons.main.textContent = 'Start Over';
        this.stopTicks();
        this.setup();
        break;
      case STATES.PLAYING:
      default:
        this.currentState = STATES.PAUSED;
        this.buttons.main.textContent = 'Resume';
        this.stopTicks();
        break;
    };
    console.log('current state', this.currentState);
  }
  
  tick() {
    // game tick
  }
  
  fixedUpdate() {
    // once per frame
  }

  setup() {
    // setup game


    this.currentState = STATES.READY;
  }

  toggleMenu() {
    if (this.views.menu.classList.contains('hidden')) {
      this.views.menu.classList.remove('hidden');
    } else if (!this.views.menu.classList.contains('hidden') && ![STATES.READY, STATES.GAME_OVER, STATES.GAME_START].includes(this.currentState)) {
      this.views.menu.classList.add('hidden');
    }
  }
}
