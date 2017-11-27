const REFRESH_S = 10;
HTMLElement.prototype.append = function (tag, fn) {
    let el = document.createElement(tag);
    if (typeof fn === "function")
        fn(el);
    this.appendChild(el);
    return el;
};
let contentEl = document.getElementById("content");
async function dashboard() {
    let data = await fetch("/data");
    if (data.ok) {
        let hosts = await data.json();
        // clear content
        while (contentEl.lastChild)
            contentEl.removeChild(contentEl.lastChild);
        for (let host of Object.keys(hosts)) {
            let h = hosts[host], hostEl = contentEl.append("div");
            hostEl.append("div", el => {
                el.className = "host";
                el.append("h3").textContent = host;
                el.append("small").textContent = new Date(h.timeStamp).toLocaleString();
            });
            hostEl.append("div", el => {
                el.className = "warp";
                for (let pid of Object.keys(h.history)) {
                    el.append("div", el => {
                        el.className = "box";
                        let p = h.history[pid];
                        el.append("u").textContent = `${p.app}:${pid}`;
                        for (let key of Object.keys(p.metric)) {
                            let v = p.metric[key];
                            el.append("p").textContent = `${key}: ${v[v.length - 1]}`;
                        }
                    });
                }
            });
        }
    }
    setTimeout(() => { dashboard(); }, 1000 * REFRESH_S);
}
dashboard();
//# sourceMappingURL=Dashboard.js.map