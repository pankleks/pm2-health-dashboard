const REFRESH_S = 10;
let contentEl = document.getElementById("content");
async function dashboard() {
    let data = await fetch("/data");
    if (data.ok) {
        let history = await data.json();
        // clear content
        while (contentEl.lastChild)
            contentEl.removeChild(contentEl.lastChild);
        for (let pid of Object.keys(history)) {
            let boxEl = document.createElement("div");
            boxEl.className = "box";
            let html = `<p>${pid}</p>`, app = history[pid];
            for (let key of Object.keys(app)) {
                html += `<p>${key}</p>`;
            }
            boxEl.innerHTML = html;
            contentEl.appendChild(boxEl);
        }
    }
    setTimeout(() => { dashboard(); }, 1000 * REFRESH_S);
}
dashboard();
//# sourceMappingURL=Dashboard.js.map