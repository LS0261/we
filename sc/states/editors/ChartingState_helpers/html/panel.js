export function initPanel() {
    // Crear contenedor principal si no existe
    let optionsPanel = document.getElementById("optionsPanel");
    if (!optionsPanel) {
        optionsPanel = document.createElement("div");
        optionsPanel.id = "optionsPanel";
        optionsPanel.style.position = "absolute";
        optionsPanel.style.top = "50px";
        optionsPanel.style.left = "50px";
        optionsPanel.style.width = "400px";
        optionsPanel.style.height = "300px";
        optionsPanel.style.background = "#222";
        optionsPanel.style.border = "2px solid #fff";
        document.body.appendChild(optionsPanel);
    }

    // Header para drag
    let optionsHeader = document.getElementById("optionsHeader");
    if (!optionsHeader) {
        optionsHeader = document.createElement("div");
        optionsHeader.id = "optionsHeader";
        optionsHeader.textContent = "Chart Panel";
        optionsHeader.style.background = "#555";
        optionsHeader.style.color = "#fff";
        optionsHeader.style.padding = "5px";
        optionsHeader.style.cursor = "move";
        optionsPanel.appendChild(optionsHeader);
    }

    // Tabs (ejemplo básico si no existen)
    let tabs = optionsPanel.querySelectorAll(".tab");
    let tabContents = optionsPanel.querySelectorAll(".tabContent");

    if (!tabs.length) {
        // Crear 2 tabs de ejemplo
        const tabNames = ["Notes", "Settings"];
        tabContents = [];
        tabs = [];

        tabNames.forEach((name, i) => {
            const tab = document.createElement("div");
            tab.className = "tab";
            tab.dataset.tab = `tabContent${i}`;
            tab.textContent = name;
            tab.style.display = "inline-block";
            tab.style.padding = "5px 10px";
            tab.style.cursor = "pointer";
            if (i === 0) tab.classList.add("active");
            optionsPanel.appendChild(tab);
            tabs.push(tab);

            const content = document.createElement("div");
            content.id = `tabContent${i}`;
            content.className = "tabContent";
            content.style.display = i === 0 ? "block" : "none";
            content.style.padding = "10px";
            content.style.color = "#fff";
            content.textContent = `${name} content`;
            optionsPanel.appendChild(content);
            tabContents.push(content);
        });
    }

    // Añadir listeners a tabs
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tabContents.forEach(c => {
                c.classList.remove("active");
                c.style.display = "none";
            });

            tab.classList.add("active");
            const content = document.getElementById(tab.dataset.tab);
            if (content) {
                content.classList.add("active");
                content.style.display = "block";
            }
        });
    });

    // Drag del panel
    let isDragging = false;
    let offsetX, offsetY;

    optionsHeader.addEventListener("mousedown", e => {
        isDragging = true;
        offsetX = e.clientX - optionsPanel.offsetLeft;
        offsetY = e.clientY - optionsPanel.offsetTop;
    });

    document.addEventListener("mousemove", e => {
        if (isDragging) {
            optionsPanel.style.left = `${e.clientX - offsetX}px`;
            optionsPanel.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });
}
