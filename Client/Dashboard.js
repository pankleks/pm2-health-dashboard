const REFRESH_S = 10;
HTMLElement.prototype.$add = function (tag, fn) {
    let el = document.createElement(tag);
    if (typeof fn === "function")
        fn(el);
    this.appendChild(el);
    return el;
};
HTMLElement.prototype.$clear = function () {
    while (this.lastChild)
        this.removeChild(this.lastChild);
};
let contentEl = document.getElementById("content");
async function dashboard() {
    let data = await fetch("/data");
    if (data.ok) {
        let hosts = await data.json();
        contentEl.$clear();
        for (let host of Object.keys(hosts)) {
            let h = hosts[host], hostEl = contentEl.$add("div");
            hostEl.$add("div", el => {
                el.className = "host";
                el.$add("h3").textContent = host;
                el.$add("small").textContent = new Date(h.timeStamp).toLocaleString();
            });
            hostEl.$add("div", el => {
                el.className = "warp";
                for (let pid of Object.keys(h.history)) {
                    el.$add("div", el => {
                        el.className = "box";
                        let p = h.history[pid];
                        el.$add("u").textContent = `${p.app}:${pid}`;
                        for (let key of Object.keys(p.metric)) {
                            let v = p.metric[key];
                            el.$add("p", el => {
                                if (v.bad)
                                    el.className = "bad";
                                el.textContent = `${key}: ${v.v}`;
                            });
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