export function initSustain() {
    // Contenedor principal
    let sustainContainer = document.getElementById("sustainContainer");
    if (!sustainContainer) {
        sustainContainer = document.createElement("div");
        sustainContainer.id = "sustainContainer";
        sustainContainer.style.position = "absolute";
        sustainContainer.style.top = "80px";
        sustainContainer.style.left = "10px";
        sustainContainer.style.background = "#222";
        sustainContainer.style.color = "#fff";
        sustainContainer.style.padding = "10px";
        sustainContainer.style.border = "2px solid #fff";
        document.body.appendChild(sustainContainer);
    }

    // Input para sustain
    let sustainInput = document.getElementById("sustainLength");
    if (!sustainInput) {
        sustainInput = document.createElement("input");
        sustainInput.id = "sustainLength";
        sustainInput.type = "number";
        sustainInput.value = "1";
        sustainInput.step = "0.1";
        sustainInput.style.width = "50px";
        sustainInput.style.marginRight = "5px";
        sustainContainer.appendChild(sustainInput);
    }

    // Botón + (aumentar)
    let btnSustainUp = document.getElementById("btnSustainUp");
    if (!btnSustainUp) {
        btnSustainUp = document.createElement("button");
        btnSustainUp.id = "btnSustainUp";
        btnSustainUp.textContent = "+";
        btnSustainUp.style.marginRight = "5px";
        sustainContainer.appendChild(btnSustainUp);
    }

    // Botón - (disminuir)
    let btnSustainDown = document.getElementById("btnSustainDown");
    if (!btnSustainDown) {
        btnSustainDown = document.createElement("button");
        btnSustainDown.id = "btnSustainDown";
        btnSustainDown.textContent = "-";
        sustainContainer.appendChild(btnSustainDown);
    }

    // Lógica de eventos
    sustainInput.addEventListener("input", (e) => {
        if (window.selectedNote) {
            window.selectedNote.sLen = parseFloat(e.target.value);
            if (window.render) window.render();
        }
    });

    btnSustainUp.addEventListener("click", () => {
        if (window.selectedNote) {
            sustainInput.stepUp();
            window.selectedNote.sLen = parseFloat(sustainInput.value);
            if (window.render) window.render();
        }
    });

    btnSustainDown.addEventListener("click", () => {
        if (window.selectedNote) {
            sustainInput.stepDown();
            window.selectedNote.sLen = parseFloat(sustainInput.value);
            if (window.render) window.render();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (!window.selectedNote) return;
        if (event.key.toLowerCase() === "e") {
            sustainInput.stepUp();
            window.selectedNote.sLen = parseFloat(sustainInput.value);
            if (window.render) window.render();
        } else if (event.key.toLowerCase() === "q") {
            sustainInput.stepDown();
            window.selectedNote.sLen = parseFloat(sustainInput.value);
            if (window.render) window.render();
        }
    });
}
