import Paths from "../backend/Paths.js";
import { SpriteAnim } from "../backend/SpriteAnim.js";
import { Alphabet, AlphaCharacter } from "../object/alphabet.js";
import MainMenuState from './MainMenuState.js';
import FlxSpriteJS from "../utils/FlxSpriteJS.js";
import CustomFadeTransition from "../backend/CustomFadeTransition.js";

export default class TitleState {
  constructor(game) {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 1280;
    this.canvas.height = 720;

    this.game = game;
    this.loaded = false;

    this.bpm = 102;
    this.menuMusic = null;
    this.transitioning = false;
    this.newTitle = false;
    this.titleTimer = 0;
    this.idleTime = 0;
    this.sickBeats = 1;
    this.closedState = false;
    this.skippedIntro = false;

    this.coolTextObjects = []; // ahora serán objetos Alphabet

    this.msPerBeat = 60000 / this.bpm;
    this.songStart = null;
    this.allowEnter = false;
    this.introPlaying = true;
    this.lastBeat = 0;
    this.gfDance = null;
    this.logoBl = null;
    this.titleText = null;
    this.titleTextColors = [0xFF33FFFF, 0xFF3333CC];
    this.titleTextAlphas = [1, .64];

    this.danceLeftFrames = [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29];
    this.danceRightFrames = [30,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];

    this.ready = false;

    if (this.game.introPlayed) {
      this.introPlaying = false;
      this.allowEnter = true;
      this.sickBeats = 17;
    } else {
      this.introPlaying = true;
      this.allowEnter = false;
      this.sickBeats = 1;
    }

    this.init();
  }

  async init() {
    this.menuDiv = document.getElementById('menu');
    this.menuDiv.style.position = 'relative';
    this.menuDiv.innerHTML = '';

    // cargar alfabeto
    await AlphaCharacter.loadAlphabetData("alphabet");

    this.playMenuMusic();
    this.bindInput();

    // Logo
    this.logoBl = new SpriteAnim("logoBumpin");
    await this.logoBl.init({ imageName: "logoBumpin", position: [-150, -100], scale: 1 });
    this.logoBl.addAnim("bump", "logo bumpin", 24, false);
    this.logoBl.play("bump");

    // GF Dance
    this.gfDance = new SpriteAnim("gfDanceTitle");
    await this.gfDance.init({ imageName: "gfDanceTitle", position: [512, 40], scale: 1 });
    this.gfDance.addAnim("danceLeft", "gfDance", 24, false, "", this.danceLeftFrames);
    this.gfDance.addAnim("danceRight", "gfDance", 24, false, "", this.danceRightFrames);
    this.gfDance.addAnim("idle", "gfDance idle", 24, true);
    this.gfDance.play("danceRight");

    // Título principal (solo anim idle)
    this.titleText = new SpriteAnim("titleEnter");
    await this.titleText.init({ imageName: "titleEnter", position: [100, 576], scale: 1 });
    this.titleText.addAnim("idle", "ENTER IDLE", 24, false);
    this.titleText.play("idle");

    // Fondo negro
    this.blackScreen = document.createElement('div');
    this.blackScreen.style.position = 'absolute';
    this.blackScreen.style.top = '0';
    this.blackScreen.style.left = '0';
    this.blackScreen.style.width = '100%';
    this.blackScreen.style.height = '100%';
    this.blackScreen.style.backgroundColor = 'black';
    this.blackScreen.style.opacity = '1';
    this.blackScreen.style.transition = 'opacity 1s ease-in-out';
    this.menuDiv.prepend(this.blackScreen);

    // NG Logo
    this.ngSpr = new FlxSpriteJS(0, this.canvas.height * 0.52);
    this.ngSpr.visible = false;
    this.ngSpr.loadGraphic(Paths.image('newgrounds_logo')).then(() => {
      this.ngSpr.setGraphicSize(Math.floor(this.ngSpr.width * 0.8));
      this.ngSpr.updateHitbox();
      this.ngSpr.screenCenter("X");
    });
    
    this.ready = true;
  }

  update(delta) {
    if (!this.ready) return;

    this.idleTime += delta;

    // sincronizar beats
  if (this.menuMusic && !this.menuMusic.paused) {
    if (this.songStart === null) this.songStart = performance.now();
    const songPos = performance.now() - this.songStart;
    const curBeat = Math.floor(songPos / this.msPerBeat);

    if (curBeat > this.lastBeat) {
      this.lastBeat = curBeat;
      this.sickBeats = curBeat;  // sincronizar sickBeats con curBeat
      this.beatHit();
    }
  }
  
    // animaciones
    if (this.gfDance) {
      this.gfDance.pos[1] = 40 + Math.sin(this.idleTime * 2) * 5;
      this.gfDance.angle = Math.sin(this.idleTime * 2) * 2;
      this.gfDance.update(delta);
    }
    this.logoBl.update(delta);
    this.titleText.update(delta);

    // shimmer de colores del título
    if (!this.pressedEnter) {
      this.titleTimer += delta;
      if (this.titleTimer > 2) this.titleTimer -= 2;
      let timer = this.titleTimer;
      if (timer >= 1) timer = -timer + 2;
      let eased = timer * timer * (3 - 2 * timer);

      let c1 = this.titleTextColors[0];
      let c2 = this.titleTextColors[1];
      let r1 = (c1 >> 16) & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = c1 & 0xFF;
      let r2 = (c2 >> 16) & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = c2 & 0xFF;
      let r = Math.floor(r1 + (r2 - r1) * eased);
      let g = Math.floor(g1 + (g2 - g1) * eased);
      let b = Math.floor(b1 + (b2 - b1) * eased);

      this.titleText.tint = `rgb(${r},${g},${b})`;
      this.titleText.alpha = this.titleTextAlphas[0] + (this.titleTextAlphas[1]-this.titleTextAlphas[0])*eased;
    } else {
      this.titleText.tint = 'rgb(255,255,255)';
      this.titleText.alpha = 1;
      if (!this.titleText.playingPress) {
        this.titleText.play('press');
        this.titleText.playingPress = true;
      }
    }

    // actualizar textos creados con Alphabet
    for (let alph of this.coolTextObjects) {
      alph.update(delta);
    }
  }

  draw() {
    if (!this.ready) return;

    const ctx = this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    if (this.gfDance && this.gfDance.loaded) this.gfDance.draw(ctx);
    this.logoBl.draw(ctx);
    this.titleText.draw(ctx);

    if (this.ngSpr.visible) this.ngSpr.draw(ctx);

    for (let alph of this.coolTextObjects) {
      for (let letter of alph.letters) {
        letter.animation.pos = [letter.x, letter.y];
        letter.animation.scale = [letter.scale.x, letter.scale.y];
        letter.animation.draw(ctx);
      }
    }
  }

  beatHit() {
if (this.closedState) {
  console.log('Beat ignored due to closedState:', this.closedState, this.sickBeats);
  return;
}

    this.sickBeats++;
    console.log("Beat:", this.sickBeats);

    switch(this.sickBeats) {
      case 1:
        this.menuMusic.volume = 0;
        this.menuMusic.play();
        break;
      case 2:
        this.createCoolText(["con todo cariño"], 40);
        break;
      case 4:
        this.addMoreText("para ZAP", 40);
        this.addMoreText("vv", 40);
        break;
      case 5:
        this.deleteCoolText();
        break;
      case 6:
        this.createCoolText(["Not associated","with"], -40);
        break;
      case 8:
        this.addMoreText("newgrounds",-40);
        this.ngSpr.visible = true;
        break;
      case 9:
        this.deleteCoolText();
        this.ngSpr.visible = false;
        break;
      case 14:
        this.createCoolText(["Friday"]);
        break;
      case 15:
        this.addMoreText("Night");
        break;
      case 16:
        this.addMoreText("Funkin");
        break;
      case 17:
        this.doTransitionToMenu();
        this.introPlaying = false;
        this.allowEnter = true;
        break;
    }

    if (this.gfDance) {
      const animName = (this.sickBeats % 2 === 0) ? "danceLeft" : "danceRight";
      this.gfDance.play(animName, true);
    }
    this.logoBl.play("bump", true);
  }

playMenuMusic() {
  if (!this.game.menuMusic) {
    const audioPath = Paths.music('freakyMenu');
    this.game.menuMusic = new Audio(audioPath);
    this.game.menuMusic.loop = true;
    this.game.menuMusic.volume = 0;

    this.game.menuMusic.play().then(() => {
      const fadeInDuration = 3000;
      const fadeStep = 50;
      const targetVolume = 0.6;
      const volumeIncrement = targetVolume / (fadeInDuration / fadeStep);

      const fadeInterval = setInterval(() => {
        if (this.game.menuMusic.volume + volumeIncrement >= targetVolume) {
          this.game.menuMusic.volume = targetVolume;
          clearInterval(fadeInterval);
        } else {
          this.game.menuMusic.volume += volumeIncrement;
        }
      }, fadeStep);
    }).catch(console.error);
  }
}

  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (this.transitioning) return;
      if (e.key === 'Enter') {
        if (this.introPlaying) this.skipIntro();
        else if (this.allowEnter) this.onEnterPressed();
      }
    });

    window.addEventListener('pointerdown', () => {
      if (this.transitioning) return;
      if (this.introPlaying) this.skipIntro();
      else if (this.allowEnter) this.onEnterPressed();
    });
  }

async onEnterPressed() {
  if (this.transitioning || !this.allowEnter) return;
  this.transitioning = true;

  const audio = new Audio(Paths.sound('confirmMenu'));
  audio.volume = 0.7;
  audio.play();

  new CustomFadeTransition(this.game, 1.0, async () => {
    const newState = new MainMenuState(this.game);

    // Espera a que se cargue todo
    await newState.load();

    // Ahora sí cambiar de estado
    this.game.changeState(newState);
  });
}

  doTransitionToMenu() {
    if (this.transitioning) return;
    this.transitioning = true;

    this.blackScreen.style.transition = 'opacity 1s ease-in-out';
    this.blackScreen.style.opacity = '1';

    this.deleteCoolText();

    setTimeout(() => {
      this.closedState = true;
      if (this.game) this.game.changeState(new MainMenuState(this.game));
    }, 1000);
  }

  skipIntro() {
    if (!this.introPlaying) return;

    console.log('Skipping intro...');
    this.introPlaying = false;
    this.transitioning = true;

    this.deleteCoolText();
    this.ngSpr.visible = true;

    if (this.gfDance) {
      this.gfDance.play("danceRight", true);
      this.gfDance.pos[1] = 40;
      this.gfDance.angle = 0;
    }

    this.sickBeats = 17;

    if (this.menuMusic) {
      const secondsPerBeat = 60 / this.bpm;
      this.menuMusic.currentTime = this.sickBeats * secondsPerBeat;
      this.menuMusic.volume = 0.6;
      this.menuMusic.play();
      this.songStart = performance.now() - this.sickBeats * this.msPerBeat;
      this.lastBeat = this.sickBeats;
    }

    this.doTransitionToMenu();
    this.allowEnter = true;

    // Flash blanco
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'white';
    flash.style.opacity = '1';
    flash.style.transition = 'opacity 1.5s ease-out';
    this.menuDiv.appendChild(flash);

    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => {
        if (flash.parentNode) flash.parentNode.removeChild(flash);
        this.transitioning = false;
      }, 1500);
    }, 0);

    this.blackScreen.style.transition = 'none';
    this.blackScreen.style.opacity = '0';
  }

  createCoolText(textArray, offsetY = 0) {
    textArray.forEach(text => {
      const alph = new Alphabet(640, 200 + offsetY, text, true);
      alph.setAlignmentFromString("CENTERED");
      this.coolTextObjects.push(alph);
    });
  }

  addMoreText(text, offsetY = 0) {
    const alph = new Alphabet(640, 200 + offsetY + this.coolTextObjects.length * 60, text, true);
    alph.setAlignmentFromString("CENTERED");
    this.coolTextObjects.push(alph);
  }

  deleteCoolText() {
    this.coolTextObjects = [];
  }

  destroy() {
    console.log("Destruyendo TitleState...");
    if (this.blackScreen && this.blackScreen.parentNode) {
      this.blackScreen.parentNode.removeChild(this.blackScreen);
      this.blackScreen = null;
    }

    this.deleteCoolText();
    this.gfDance = null;
    this.logoBl = null;
    this.titleText = null;
    this.ngSpr = null;
    this.closedState = true;
  }
}
