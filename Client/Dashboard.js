const REFRESH_S = 20;
async function initDashboard(contentEl) {
    let data = await fetch("/data");
    if (data.ok) {
        let hosts = await data.json();
        contentEl.$clear();
        for (let host in hosts) {
            let h = hosts[host], hostEl = contentEl.$add("div", "flex v s3");
            hostEl.$add("div", "flex h center", el => {
                el.$add("h3").textContent = host;
                el.$add("small", "end").textContent = new Date(h.timeStamp).toLocaleString();
            });
            hostEl.$add("div", "flex w s3", el => {
                for (let appId in h.app) {
                    el.$add("div", "box flex v s1", el => {
                        let app = h.app[appId];
                        el.$add("u").textContent = `${app.name}:${appId}`;
                        for (let key in app.metric) {
                            let v = app.metric[key].v;
                            el.$add("small", v.bad ? "bad" : "").innerHTML = `${key}: <b>${v.v}</b>`;
                        }
                        el.onclick = () => {
                            window.location.href = `App.html?host=${encodeURIComponent(host)}&appId=${appId}`;
                        };
                    });
                }
            });
        }
    }
    setTimeout(() => { initDashboard(contentEl); }, 1000 * REFRESH_S);
}
async function initApp(contentEl) {
    let input = parseQS(location.search);
    if (!input.host || !input.appId)
        throw new Error(`no host/app`);
    google.charts.load("current", { packages: ["corechart"] });
    let data = await fetch("/app", {
        method: "POST",
        body: JSON.stringify(input)
    });
    if (data.ok) {
        let app = await data.json();
        contentEl.$clear();
        contentEl.$add("h2").textContent = app.name;
        contentEl.$add("div", "flex v s3", el => {
            for (let key in app.metric) {
                if (app.metric[key].history && app.metric[key].history.length > 0) {
                    el.$add("p").textContent = key;
                    let chartEl = el.$add("div", "chart");
                    google.charts.setOnLoadCallback(() => {
                        let data = google.visualization.arrayToDataTable(app.metric[key].history.map((e, i) => [i, e.v]), true), options = {
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
    }
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