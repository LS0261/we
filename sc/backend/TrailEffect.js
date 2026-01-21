export class TrailEffect {
    constructor(container = document.body, onTapEnter = null) {
        this.container = container;
        this.points = [];
        this.maxPoints = 10;
        this.lastPos = null;
        this.lastTime = performance.now();
        this.isDown = false;
        this.startPos = null;
        this.onTapEnter = onTapEnter;

        this.initEvents();
    }

    initEvents() {
        // MOUSE
        window.addEventListener("mousedown", (e) => {
            this.isDown = true;
            this.lastPos = { x: e.clientX, y: e.clientY };
            this.startPos = { x: e.clientX, y: e.clientY };
            this.lastTime = performance.now();
            this.createWave(e.clientX, e.clientY); // <-- siempre onda
        });
        window.addEventListener("mouseup", (e) => {
            this.isDown = false;
            this.checkTap(e.clientX, e.clientY);
        });
        window.addEventListener("mousemove", (e) => {
            if (this.isDown) this.addPoint(e.clientX, e.clientY);
        });

        // TOUCH
        window.addEventListener("touchstart", (e) => {
            const t = e.touches[0];
            this.isDown = true;
            this.lastPos = { x: t.clientX, y: t.clientY };
            this.startPos = { x: t.clientX, y: t.clientY };
            this.lastTime = performance.now();
            this.createWave(t.clientX, t.clientY); // <-- siempre onda
        });
        window.addEventListener("touchend", (e) => {
            this.isDown = false;
            const t = e.changedTouches[0];
            this.checkTap(t.clientX, t.clientY);
        });
        window.addEventListener("touchmove", (e) => {
            if (!this.isDown) return;
            const t = e.touches[0];
            this.addPoint(t.clientX, t.clientY);
        });
    }

    checkTap(x, y) {
        const dx = x - this.startPos.x;
        const dy = y - this.startPos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 10 && this.onTapEnter) {
            this.onTapEnter(); // solo tap corto dispara Enter
        }
    }

    addPoint(x, y) {
        const now = performance.now();
        const dx = x - this.lastPos.x;
        const dy = y - this.lastPos.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dt = now - this.lastTime || 16;
        const speed = dist / dt;

        const thickness = Math.min(Math.max(5 / (speed + 0.01) * 2, 2), 6);

        if (this.lastPos) {
            const segment = document.createElement("div");
            segment.style.position = "fixed";
            segment.style.left = this.lastPos.x + "px";
            segment.style.top = this.lastPos.y + "px";
            segment.style.width = dist + "px";
            segment.style.height = thickness + "px";
            segment.style.background = "#00ffff";
            segment.style.borderRadius = thickness + "px"; // punta redondeada
            segment.style.transformOrigin = "0 50%";

            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            segment.style.transform = `rotate(${angle}deg)`;
            segment.style.pointerEvents = "none";
            segment.style.opacity = "0.6";
            segment.style.transition = "opacity 0.5s linear";

            this.container.appendChild(segment);
            this.points.push(segment);

            if (this.points.length > this.maxPoints) {
                const old = this.points.shift();
                old.remove();
            }

            setTimeout(() => {
                segment.style.opacity = "0";
                setTimeout(() => segment.remove(), 500);
            }, 50);
        }

        this.lastPos = { x, y };
        this.lastTime = now;
    }

    createWave(x, y) {
        const wave = document.createElement("div");
        wave.style.position = "fixed";
        wave.style.left = x + "px";
        wave.style.top = y + "px";
        wave.style.width = "0px";
        wave.style.height = "0px";
        wave.style.border = "2px solid #00ffff";
        wave.style.borderRadius = "50%";
        wave.style.pointerEvents = "none";
        wave.style.opacity = "0.6";
        wave.style.transition = "width 0.5s ease-out, height 0.5s ease-out, margin 0.5s ease-out, opacity 0.5s ease-out";

        this.container.appendChild(wave);

        requestAnimationFrame(() => {
            wave.style.width = "80px";
            wave.style.height = "80px";
            wave.style.marginLeft = "-40px";
            wave.style.marginTop = "-40px";
            wave.style.opacity = "0";
        });

        setTimeout(() => wave.remove(), 500);
    }
}
