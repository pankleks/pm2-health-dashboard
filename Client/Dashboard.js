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
let dashboardT;
async function dashboard(contentEl) {
    let data = await fetch("/data");
    if (data.ok) {
        let payload = await data.json();
        contentEl.$clear();
        for (let host of Object.keys(payload)) {
            let h = payload[host], hostEl = contentEl.$add("div", "flex v s3");
            hostEl.$add("div", "flex h center", el => {
                el.$add("h3").textContent = host;
                el.$add("small", "end").textContent = new Date(h.timeStamp).toLocaleString();
            });
            hostEl.$add("div", "flex w s3", el => {
                for (let pid of Object.keys(h.snapshot)) {
                    el.$add("div", "box flex v s1", el => {
                        let p = h.snapshot[pid];
                        el.$add("u").textContent = `${p.app}:${pid}`;
                        for (let key of Object.keys(p.metric)) {
                            let v = p.metric[key];
                            el.$add("small", v.bad ? "bad" : "").textContent = `${key}: ${v.v}`;
                        }
                        el.onclick = () => {
                            clearTimeout(dashboardT);
                            app(contentEl, host, pid);
                        };
                    });
                }
            });
        }
    }
    dashboardT = setTimeout(() => { dashboard(contentEl); }, 1000 * REFRESH_S);
}
async function app(contentEl, host, pid) {
    let data = await fetch("/app", {
        method: "POST",
        body: JSON.stringify({ host, pid })
    });
    if (data.ok) {
        let payload = await data.json();
        contentEl.$clear();
        contentEl.$add("h2").textContent = payload.snapshot.app;
        contentEl.$add("div", "flex v s3", el => {
            for (let key of Object.keys(payload.snapshot.metric)) {
                el.$add("p").textContent = key;
            }
        });
    }
}
//# sourceMappingURL=Dashboard.js.map