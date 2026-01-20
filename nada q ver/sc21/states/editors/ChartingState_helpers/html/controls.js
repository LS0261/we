export function initControls(editor) {
    const container = document.getElementById("controlsContainer") || (() => {
        const c = document.createElement("div");
        c.id = "controlsContainer";
        c.style.position = "absolute";
        c.style.top = "10px";
        c.style.right = "10px";
        c.style.background = "#222";
        c.style.color = "#fff";
        c.style.padding = "10px";
        c.style.border = "2px solid #fff";
        document.body.appendChild(c);
        return c;
    })();

    const buttons = [
        { id: "play", text: "▶ Play" },
        { id: "stop", text: "⏹ Stop" },
        { id: "newChart", text: "🆕 New Chart" },
        { id: "prevSection", text: "⏮ Prev Sec" },
        { id: "nextSection", text: "⏭ Next Sec" },
        { id: "mustHit", text: "🎵 MustHit" },
        { id: "scrollUp", text: "⬆ Scroll Up" },
        { id: "scrollDown", text: "⬇ Scroll Down" },
        { id: "snapLeft", text: "◀ Snap-" },
        { id: "snapRight", text: "▶ Snap+" }
    ];

    buttons.forEach(btnInfo => {
        let btn = document.getElementById(btnInfo.id);
        if (!btn) {
            btn = document.createElement("button");
            btn.id = btnInfo.id;
            btn.textContent = btnInfo.text;
            btn.style.margin = "2px";
            container.appendChild(btn);
        }
    });

    // Teclas rápidas
    document.addEventListener("keydown", e => {
        if (e.target.tagName === "INPUT") return;

        switch (e.key.toLowerCase()) {
            case " ":
                document.getElementById("play").click();
                break;
            case "s":
                document.getElementById("stop").click();
                break;
            case "n":
                document.getElementById("newChart").click();
                break;
            case "a":
                document.getElementById("prevSection").click();
                break;
            case "d":
                document.getElementById("nextSection").click();
                break;
            case "m":
                document.getElementById("mustHit").click();
                break;
            case "arrowup":
                document.getElementById("scrollUp").click();
                break;
            case "arrowdown":
                document.getElementById("scrollDown").click();
                break;
            case "arrowleft":
                document.getElementById("snapLeft").click();
                break;
            case "arrowright":
                document.getElementById("snapRight").click();
                break;
        }
    });

    // Bloquear zoom navegador (Ctrl + rueda)
    window.addEventListener("wheel", e => {
        if (e.ctrlKey) e.preventDefault();
    }, { passive: false });
}
