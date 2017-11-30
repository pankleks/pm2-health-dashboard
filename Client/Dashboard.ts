const REFRESH_S = 20;

async function initDashboard(contentEl: HTMLElement) {
    let
        data = await fetch("/data");

    if (data.ok) {
        let
            hosts: IHosts = await data.json();

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
        data = await fetch("/app", {
            method: "POST",
            body: JSON.stringify(input)
        });

    if (data.ok) {
        let
            payload: { app: IApp, history: IHistory } = await data.json();

        contentEl.$clear();

        contentEl.$add("h2").textContent = payload.app.name;

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
    }

    setTimeout(() => { initApp(contentEl); }, 1000 * REFRESH_S);
}