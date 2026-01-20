// sc/states/substates/pausemenusubstate.js
import CustomFadeTransition from "../../backend/CustomFadeTransition.js";

export default class PauseMenuSubstate {
    constructor(playState) {
        this.playState = playState;
        this.container = playState.container;

        this.paused = false;

        this.createMenu();
        this.bindInputs();
    }

    createMenu() {
        // Overlay de fondo
        this.overlay = document.createElement("div");
        this.overlay.style.position = "absolute";
        this.overlay.style.top = "0";
        this.overlay.style.left = "0";
        this.overlay.style.width = "100%";
        this.overlay.style.height = "100%";
        this.overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
        this.overlay.style.display = "none";
        this.overlay.style.zIndex = 1000;
        this.container.appendChild(this.overlay);

        // Menu principal
        this.menu = document.createElement("div");
        this.menu.style.position = "absolute";
        this.menu.style.top = "50%";
        this.menu.style.left = "50%";
        this.menu.style.transform = "translate(-50%, -50%)";
        this.menu.style.display = "flex";
        this.menu.style.flexDirection = "column";
        this.menu.style.alignItems = "center";
        this.menu.style.gap = "15px";
        this.menu.style.fontFamily = "Arial";
        this.menu.style.fontSize = "24px";
        this.menu.style.color = "#fff";
        this.overlay.appendChild(this.menu);

        const buttons = [
            { text: "Resume", action: () => this.resume() },
            { text: "Restart", action: () => this.restart() },
            { text: "Exit to Freeplay", action: () => this.exitToFreeplay() },
        ];

        this.menuButtons = [];

        buttons.forEach(b => {
            const btn = document.createElement("button");
            btn.textContent = b.text;
            btn.style.padding = "10px 20px";
            btn.style.fontSize = "20px";
            btn.style.cursor = "pointer";
            btn.style.border = "none";
            btn.style.borderRadius = "8px";
            btn.style.backgroundColor = "#333";
            btn.style.color = "#fff";
            btn.onmouseover = () => btn.style.backgroundColor = "#555";
            btn.onmouseout = () => btn.style.backgroundColor = "#333";
            btn.onclick = b.action;
            this.menu.appendChild(btn);
            this.menuButtons.push(btn);
        });
    }

    bindInputs() {
        this.keyHandler = (e) => {
            if (e.code === "Escape") {
                if (!this.paused) this.pause();
                else this.resume();
            }
        };
        window.addEventListener("keydown", this.keyHandler);
    }

    pause() {
        if (this.paused) return;
        this.paused = true;
        this.overlay.style.display = "block";
        // Pausar audio
        if (this.playState.audioInst) this.playState.audioInst.pause();
        if (this.playState.audioVoices) this.playState.audioVoices.pause();
        // Detener loop del PlayState temporalmente
        this.savedLoop = this.playState.loop;
        this.playState.loop = null;
    }

    resume() {
        if (!this.paused) return;
        this.paused = false;
        this.overlay.style.display = "none";
        // Reanudar audio
        if (this.playState.audioInst) this.playState.audioInst.play();
        if (this.playState.audioVoices) this.playState.audioVoices.play();
        // Reanudar loop
        this.playState.loop = this.savedLoop;
        requestAnimationFrame((t) => this.playState.loop(t));
    }

    restart() {
        new CustomFadeTransition(this.playState.game, 0.5, () => {
            // destruir PlayState y volver a iniciar la canción
            const songName = this.playState.songName;
            this.playState.destroy();
            this.playState.game.changeState(new this.playState.constructor(this.playState.game, songName));
        });
    }

    exitToFreeplay() {
        new CustomFadeTransition(this.playState.game, 0.5, () => {
            this.playState.destroy();
            import("../freeplaystate.js").then(({ default: FreeplayState }) => {
                this.playState.game.changeState(new FreeplayState(this.playState.game));
            });
        });
    }

    destroy() {
        window.removeEventListener("keydown", this.keyHandler);
        this.overlay.remove();
    }
}
