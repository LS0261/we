export function initSnap() {
    // Crear contenedor si no existe
    let snapContainer = document.getElementById("snapContainer");
    if (!snapContainer) {
        snapContainer = document.createElement("div");
        snapContainer.id = "snapContainer";
        snapContainer.style.position = "absolute";
        snapContainer.style.top = "10px";
        snapContainer.style.left = "10px";
        snapContainer.style.background = "#333";
        snapContainer.style.color = "#fff";
        snapContainer.style.padding = "10px";
        snapContainer.style.border = "2px solid #fff";
        document.body.appendChild(snapContainer);
    }

    // Snap display
    let snapDisplay = document.getElementById("snapDisplay");
    if (!snapDisplay) {
        snapDisplay = document.createElement("div");
        snapDisplay.id = "snapDisplay";
        snapDisplay.style.marginBottom = "5px";
        snapContainer.appendChild(snapDisplay);
    }

    // Snap input oculto
    let snapInput = document.getElementById("snap");
    if (!snapInput) {
        snapInput = document.createElement("input");
        snapInput.id = "snap";
        snapInput.type = "number";
        snapInput.value = "4";
        snapInput.style.width = "50px";
        snapInput.style.marginRight = "5px";
        snapContainer.appendChild(snapInput);
    }

    // Botón izquierda
    let snapLeft = document.getElementById("snapLeft");
    if (!snapLeft) {
        snapLeft = document.createElement("button");
        snapLeft.id = "snapLeft";
        snapLeft.textContent = "<";
        snapLeft.style.marginRight = "5px";
        snapContainer.appendChild(snapLeft);
    }

    // Botón derecha
    let snapRight = document.getElementById("snapRight");
    if (!snapRight) {
        snapRight = document.createElement("button");
        snapRight.id = "snapRight";
        snapRight.textContent = ">";
        snapContainer.appendChild(snapRight);
    }

    function updateSnapDisplay() {
        snapDisplay.innerText = `Snap: ${snapInput.value}`;
    }

    snapLeft.addEventListener("click", () => {
        let val = parseInt(snapInput.value);
        if (val > 1) snapInput.value = val - 1;
        updateSnapDisplay();
    });

    snapRight.addEventListener("click", () => {
        let val = parseInt(snapInput.value);
        snapInput.value = val + 1;
        updateSnapDisplay();
    });

    updateSnapDisplay();
}
