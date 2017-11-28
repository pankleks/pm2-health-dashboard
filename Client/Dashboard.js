const REFRESH_S = 10;
HTMLElement.prototype.$add = function (tag, css, fn) {
    let el = document.createElement(tag);
    if (css)
        el.className = css;
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
            let h = hosts[host], hostEl = contentEl.$add("div", "flex v list");
            hostEl.$add("div", "flex h list", el => {
                el.$add("h3").textContent = host;
                el.$add("small").textContent = new Date(h.timeStamp).toLocaleString();
            });
            hostEl.$add("div", "flex w list", el => {
                for (let pid of Object.keys(h.snapshot)) {
                    el.$add("div", "box flex v list", el => {
                        let p = h.snapshot[pid];
                        el.$add("u").textContent = `${p.app}:${pid}`;
                        for (let key of Object.keys(p.metric)) {
                            let v = p.metric[key];
                            el.$add("p", v.bad ? "bad" : "").textContent = `${key}: ${v.v}`;
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