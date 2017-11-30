const REFRESH_S = 20;

async function initDashboard(contentEl: HTMLElement) {
    let
        hosts = await json<IHosts>("/data");

    contentEl.$clear();

    for (let host in hosts) {
        let
            h = hosts[host],
            hostEl = contentEl.$add("div", "flex v s3");

        hostEl.$add("div", "flex h center", el => {
            el.$add("h3").textContent = h.name;
            el.$add("small", "end").textContent = new Date(h.timeStamp).toLocaleString();
        });

        hostEl.$add("div", "flex w s3", el => {
            for (let appId in h.app) {
                el.$add("div", "box flex v s1", el => {
                    let
                        app = h.app[appId];
                    el.$add("u").textContent = `${app.name}:${appId}`;

                    for (let key in app.metric) {
                        let
                            v = app.metric[key];

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

async function initApp(contentEl: HTMLElement) {
    let
        input = parseQS(location.search);
    if (!input.host || !input.appId)
        throw new Error(`no host/app`);

    google.charts.load("current", { packages: ["corechart"] });

    let
        payload = await json<{ app: IApp, history: IHistory }>("/app", input);

    contentEl.$clear();

    contentEl.$add("div", "flex h s3 center", el => {
        el.$add("h2").textContent = `${input.host} ${payload.app.name}:${payload.app.id}`;
        el.$add<HTMLAnchorElement>("a", undefined, el => {
            el.textContent = "delete";
            el.href = "#";
            el.onclick = async () => {
                await json("/app/delete", input);
                window.location.href = "/";
            };
        });
    });

    contentEl.$add("div", "flex v s3", el => {
        for (let key in payload.app.metric) {
            let
                history = payload.history[payload.app.id + key];
            if (history && history.length > 0) {
                let
                    chartEl = el.$add("div", "chart");

                google.charts.setOnLoadCallback(() => {
                    let
                        data = google.visualization.arrayToDataTable(
                            history.map((e, i) => [i, e.v]),
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
        }
    });

    setTimeout(() => { initApp(contentEl); }, 1000 * REFRESH_S);
}