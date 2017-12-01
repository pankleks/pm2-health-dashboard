const REFRESH_S = 20;
async function initDashboard(contentEl) {
    let hosts = await json("/data");
    contentEl.$clear();
    for (let host in hosts) {
        let h = hosts[host], hostEl = contentEl.$add("div", "flex v s3");
        hostEl.$add("div", "flex h center", el => {
            el.$add("h3").textContent = h.name;
            el.$add("small", "end").textContent = new Date(h.timeStamp).toLocaleString();
        });
        hostEl.$add("div", "flex w s3", el => {
            for (let appId in h.app) {
                el.$add("div", "box flex v s1", el => {
                    let app = h.app[appId];
                    el.$add("u").textContent = `${app.name}:${appId}`;
                    for (let key in app.metric) {
                        let v = app.metric[key];
                        el.$add("small", v.bad ? "bad" : "").innerHTML = `${key}: <b>${v.v}</b>`;
                    }
                    el.onclick = () => {
                        window.location.href = `App.html?host=${encodeURIComponent(host)}&appId=${appId}`;
                    };
                });
            }
        });
    }
    setTimeout(() => { initDashboard(contentEl); }, 1000 * REFRESH_S);
}
async function initApp(contentEl) {
    let input = parseQS(location.search);
    if (!input.host || !input.appId)
        throw new Error(`no host/app`);
    google.charts.load("current", { packages: ["corechart"] });
    let payload = await json("/app", input);
    contentEl.$clear();
    contentEl.$add("div", "flex h s3 center", el => {
        el.$add("h2").textContent = `${input.host} ${payload.app.name}:${payload.app.id}`;
        el.$add("a", undefined, el => {
            el.textContent = "delete";
            el.href = "";
            el.onclick = async () => {
                if (confirm("are you sure?")) {
                    await json("/app/delete", input);
                    history.back();
                }
            };
        });
    });
    contentEl.$add("div", "flex v s3", el => {
        for (let key in payload.app.metric) {
            let history = payload.history[payload.app.id + key];
            if (history && history.length > 0) {
                let chartEl = el.$add("div", "chart");
                google.charts.setOnLoadCallback(() => {
                    let data = google.visualization.arrayToDataTable(history.map((e, i) => [i, e.v]), true), options = {
                        title: key,
                        curveType: "function",
                        legend: "none"
                    };
                    let chart = new google.visualization.LineChart(chartEl);
                    chart.draw(data, options);
                });
            }
        }
    });
    setTimeout(() => { initApp(contentEl); }, 1000 * REFRESH_S);
}
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
async function json(path, data) {
    let init = {};
    if (data != null)
        init = {
            method: "POST",
            body: JSON.stringify(data)
        };
    let resp = await fetch(path, init);
    if (resp.ok)
        return (await resp.json());
    throw new Error(`fetch ${path} failed`);
}
function parseQS(qs) {
    let obj = {};
    if (qs)
        for (let temp of qs.substr(1).split("&")) {
            let match = /([^=]+)=(.*)/.exec(temp);
            if (match)
                obj[match[1]] = decodeURIComponent(match[2]);
        }
    return obj;
}
//# sourceMappingURL=Dashboard.js.map