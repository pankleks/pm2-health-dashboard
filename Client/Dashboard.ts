const REFRESH_S = 10;

interface HTMLElement {
    $add<T extends HTMLElement>(tag: string, css?: string, fn?: (el: T) => void): T;
    $clear(): void;
}

HTMLElement.prototype.$add = function <T extends HTMLElement>(this: HTMLElement, tag: string, css?: string, fn?: (el: T) => void) {
    let
        el = <T>document.createElement(tag);
    if (css)
        el.className = css;
    if (typeof fn === "function")
        fn(el);
    this.appendChild(el);
    return el;
}

HTMLElement.prototype.$clear = function (this: HTMLElement) {
    while (this.lastChild)
        this.removeChild(this.lastChild);
}

let
    dashboardT;

async function dashboard(contentEl: HTMLElement) {
    let
        data = await fetch("/data");

    if (data.ok) {
        let
            payload = await data.json();

        contentEl.$clear();

        for (let host of Object.keys(payload)) {
            let
                h = payload[host],
                hostEl = contentEl.$add("div", "flex v s3");

            hostEl.$add("div", "flex h center", el => {
                el.$add("h3").textContent = host;
                el.$add("small", "end").textContent = new Date(h.timeStamp).toLocaleString();
            });

            hostEl.$add("div", "flex w s3", el => {
                for (let pid of Object.keys(h.snapshot)) {
                    el.$add("div", "box flex v s1", el => {
                        let
                            p = h.snapshot[pid];
                        el.$add("u").textContent = `${p.app}:${pid}`;

                        for (let key of Object.keys(p.metric)) {
                            let
                                v = p.metric[key];

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



async function app(contentEl: HTMLElement, host: string, pid: string) {
    google.charts.load("current", { packages: ["corechart"] });

    let
        data = await fetch("/app", {
            method: "POST",
            body: JSON.stringify({ host, pid })
        });

    if (data.ok) {
        let
            payload = await data.json();

        contentEl.$clear();

        contentEl.$add("h2").textContent = payload.snapshot.app;

        contentEl.$add("div", "flex v s3", el => {
            for (let key of Object.keys(payload.snapshot.metric)) {
                el.$add("p").textContent = key;

                let
                    chartEl = el.$add("div", "chart");

                google.charts.setOnLoadCallback(() => {
                    let
                        data = google.visualization.arrayToDataTable(
                            payload.history[key].map((e, i) => [i, e.v]),
                            true),
                        options: google.visualization.LineChartOptions = {
                            title: key,
                            curveType: "function",
                            legend: "none"
                        };

                    let
                        chart = new google.visualization.LineChart(chartEl);
                    chart.draw(data, options);
                });
            }
        });
    }
}