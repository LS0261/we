// sc/backend/BaseStage.js
import { Character } from "../object/character.js";
import NotesAssets from "../object/notes.js";

export class BaseStage {
    constructor(ps) {
        this.ps = ps;

        // Datos de juego
        this.paused = false;
        this.songName = ps?.songName ?? "";
        this.isStoryMode = ps?.isStoryMode ?? false;
        this.seenCutscene = ps?.seenCutscene ?? false;
        this.inCutscene = false;
        this.canPause = true;

        this.members = [];

        // Personajes
        this.boyfriend = null;
        this.dad = null;
        this.gf = null;

        this.boyfriendGroup = [];
        this.dadGroup = [];
        this.gfGroup = [];

        this.unspawnNotes = [];

        // Cámara
        this.camGame = { x: 0, y: 0, zoom: 1 };
        this.camHUD = { x: 0, y: 0, zoom: 1 };
        this.camOther = { x: 0, y: 0, zoom: 1 };

        this.defaultCamZoom = 1;
        this.camFollow = null;

        // FNF pasos y beats
        this.curBeat = 0;
        this.curDecBeat = 0;
        this.curStep = 0;
        this.curDecStep = 0;
        this.curSection = 0;

        // Callbacks
        this.startCallback = null;
        this.endCallback = null;

        // Llamar al init principal
        this.create();
    }

    // -------------------------------
    // Métodos que se pueden sobreescribir
    // -------------------------------
    create() {}
    createPost() {}
    countdownTick(count, num) {}
    startSong() {}

    beatHit() {}
    stepHit() {}
    sectionHit() {}

    closeSubState() {}
    openSubState(subState) {}

    eventCalled(eventName, value1, value2, flValue1, flValue2, strumTime) {}
    eventPushed(event) {}
    eventPushedUnique(event) {}

    goodNoteHit(note) {}
    opponentNoteHit(note) {}
    noteMiss(note) {}
    noteMissPress(direction) {}

    // -------------------------------
    // Métodos de utilidad
    // -------------------------------
    add(object) {
        this.members.push(object);
        return object;
    }

    remove(object) {
        const idx = this.members.indexOf(object);
        if (idx !== -1) this.members.splice(idx, 1);
        return object;
    }

    insert(position, object) {
        this.members.splice(position, 0, object);
        return object;
    }

    addBehindGF(obj) {
        const index = this.members.indexOf(this.gfGroup[0] || this.members[0]);
        return this.insert(index, obj);
    }

    addBehindBF(obj) {
        const index = this.members.indexOf(this.boyfriendGroup[0] || this.members[0]);
        return this.insert(index, obj);
    }

    addBehindDad(obj) {
        const index = this.members.indexOf(this.dadGroup[0] || this.members[0]);
        return this.insert(index, obj);
    }

    setDefaultGF(name) {
        if (!this.ps.song?.gfVersion) {
            this.ps.song.gfVersion = name;
        }
    }

    getStageObject(name) {
        return this.ps.variables?.[name];
    }

    setStartCallback(fn) {
        this.startCallback = fn;
    }

    setEndCallback(fn) {
        this.endCallback = fn;
    }

    startCountdown() {
        if (this.ps && this.ps.startCountdown) return this.ps.startCountdown();
        return false;
    }

    endSong() {
        if (this.ps && this.ps.endSong) return this.ps.endSong();
        return false;
    }

    moveCameraSection() {
        if (this.ps && this.ps.moveCameraSection) this.ps.moveCameraSection();
    }

    moveCamera(isDad) {
        if (this.ps && this.ps.moveCamera) this.ps.moveCamera(isDad);
    }
}
