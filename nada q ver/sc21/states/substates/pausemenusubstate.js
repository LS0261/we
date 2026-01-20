import CustomFadeTransition from "../../backend/CustomFadeTransition.js";

export default class PauseMenuSubstate {
    constructor(playState) {
        this.playState = playState;
        this.container = playState.container;

        this.paused = false;
        this.savedLoop = null;

        this.createMenu();
        this.bindInputs();
    }

    createMenu() {
        // Overlay de fondo
        this.overlay = document.createElement("div");
        Object.assign(this.overlay.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "none",
            zIndex: 1000
        });
        this.container.appendChild(this.overlay);

        // Menú principal
        this.menu = document.createElement("div");
        Object.assign(this.menu.style, {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "15px",
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#fff"
        });
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
            Object.assign(btn.style, {
                padding: "10px 20px",
                fontSize: "20px",
                cursor: "pointer",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#333",
                color: "#fff"
            });
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

        this.playState._paused = true;
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
            const songName = this.playState.songName;
            this.playState.destroy();
            this.playState.game.changeState(
                new this.playState.constructor(this.playState.game, songName)
            );
        });
    }

    exitToFreeplay() {
        new CustomFadeTransition(this.playState.game, 0.5, () => {
            this.playState.destroy();
            import("../freeplayState.js").then(({ default: FreeplayState }) => {
                this.playState.game.changeState(new FreeplayState(this.playState.game));
            });
        });
    }

    destroy() {
        window.removeEventListener("keydown", this.keyHandler);
        this.overlay.remove();
    }
}
