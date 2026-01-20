// sc/states/editors/ChartingState.js
import { initPanel } from './ChartingState_helpers/html/panel.js';
import { initControls } from './ChartingState_helpers/html/controls.js';
import { initSnap } from './ChartingState_helpers/html/snap.js';
import { initRender } from './ChartingState_helpers/render.js';
import { initAudio } from './ChartingState_helpers/audio.js';
import { initInteraction } from './ChartingState_helpers/interaction.js';
import { initSections } from './ChartingState_helpers/sections.js';
import { initSustain } from './ChartingState_helpers/sustain.js';
import { initFileImport } from './ChartingState_helpers/fileImport.js';
import { initFileExport } from './ChartingState_helpers/fileExport.js';
import CustomFadeTransition from "../../backend/CustomFadeTransition.js";

export default class ChartingState {
  constructor(playState, chartData) {
    this.playState = playState;
    this.songName = chartData?.songName || playState?.songName || "untitled";
    this.chart = chartData?.bfNotes || playState?.chartNotes || [];
    this.audioInst = playState?.audioInst || null;
    this.audioVoices = playState?.audioVoices || null;
    this.chartData = chartData || {};

    // Inicializa cuando el DOM esté listo
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", () => this.initCharting());
    } else {
      this.initCharting();
    }
  }

  initCharting() {
    // Crear panel si no existe
    this.upperBox = document.getElementById('upperBox') || (() => {
      const div = document.createElement('div');
      div.id = 'upperBox';
      document.body.appendChild(div);
      return div;
    })();

    this.initHelpers();
    this.initLoop();

    // Cargar canción
    this.loadAudio();
    window.chartNotes = this.chart; // fallback global para render

    // =========================
    // ESCUCHAR ENTER para volver a PlayState
    // =========================
    window.addEventListener("keydown", this._onEnterBack = (e) => {
      if (e.code === "Enter") {
        this.exitEditorToPlayState();
      }
    });
  }

  loadAudio() {
    if (!this.audioInst) {
        if (this.chartData?.audioInstSrc) {
            this.audioInst = new Audio(this.chartData.audioInstSrc);
        } else {
            this.audioInst = new Audio(`songs/${this.songName}/Inst.ogg`);
        }
    }

    if (!this.audioVoices) {
        if (this.chartData?.audioVocSrc) {
            this.audioVoices = new Audio(this.chartData.audioVocSrc);
        } else {
            this.audioVoices = new Audio(`songs/${this.songName}/Voices.ogg`) || null;
        }
    }

    this.audioInst.load();
    this.audioVoices?.load();
  }

  initHelpers() {
    initPanel(this);
    initControls(this);
    initSnap(this);
    initSustain(this);
    initRender(this);
    // initInteraction, initSections, etc...
  }

  initLoop() {
    if (typeof window.chartingMainLoop === "function") {
      this.startLoop = () => window.chartingMainLoop(this);
      this.startLoop();
    }
  }

  exitEditorToPlayState() {
    const chartData = {
        songName: this.songName,
        bpm: this.songBpm,
        bfNotes: this.chart || [],
        audioInstSrc: this.audioInst?.src || null,
        audioVocSrc: this.audioVoices?.src || null,
    };

    this.destroy();

    // Fade hacia PlayState
    new CustomFadeTransition(this.playState.game, 1.0, () => {
        this.playState.game.changeState(
            new this.playState.constructor(this.playState.game, chartData.songName)
        );
    });
  }

  destroy() {
    // Pausar y limpiar audio
    if (this.audioInst) { 
        this.audioInst.pause(); 
        this.audioInst = null; 
    }
    if (this.audioVoices) { 
        this.audioVoices.pause(); 
        this.audioVoices = null; 
    }

    // Cancelar loop
    if (this.startLoop) this.startLoop = null;

    // Quitar listener Enter
    window.removeEventListener("keydown", this._onEnterBack);

    // Limpiar canvas
    const canvas = document.getElementById("chart");
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (this.upperBox && this.upperBox.parentNode) this.upperBox.parentNode.removeChild(this.upperBox);

    // Limpiar referencias
    this.chart = [];
  }
}
