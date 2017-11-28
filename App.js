"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Http = require("http");
const Url = require("url");
const Fs = require("fs");
const Pmx = require("pmx");
const MAX_HISTORY = 1440;
Pmx.initModule({
    type: "generic",
    el: {
        actions: true
    },
    block: {
        actions: true,
        cpu: true,
        mem: true
    }
}, (ex, config) => {
    if (ex)
        process.exit(1);
    if (config.port == null)
        config.port = 8888;
    let hosts = {}, history = {}, handle = {
        "/": {
            type: "text/html",
            content: Fs.readFileSync("Client/Dashboard.html", "utf8"),
        },
        "/dashboard.css": {
            type: "text/css",
            content: Fs.readFileSync("Client/Dashboard.css", "utf8")
        },
        "/dashboard.js": {
            type: "text/javascript",
            content: Fs.readFileSync("Client/Dashboard.js", "utf8")
        },
        "/push": {
            type: "application/json",
            fn: (data) => {
                let payload = JSON.parse(data);
                if (!payload.token || config.tokens.indexOf(payload.token) === -1)
                    throw new Error(`not authenticated`);
                if (payload.host) {
                    hosts[payload.host] = payload;
                    for (let pid of Object.keys(payload.snapshot))
                        for (let key of Object.keys(payload.snapshot[pid].metric)) {
                            if (!history[pid + key])
                                history[pid + key] = [];
                            let h = history[pid + key];
                            h.push(payload.snapshot[pid].metric[key]);
                            if (h.length > MAX_HISTORY)
                                h.shift();
                        }
                }
            }
        },
        "/data": {
            type: "application/json",
            fn: () => JSON.stringify(hosts)
        },
        "/app": {
            type: "application/json",
            fn: (data) => {
                let input = JSON.parse(data), snapshot = hosts[input.host].snapshot[input.pid], temp = {
                    snapshot,
                    history: {}
                };
                for (let key of Object.keys(snapshot))
                    temp.history[key] = history[input.pid + key];
                return JSON.stringify(temp);
            }
        }
    };
    Http
        .createServer((request, response) => {
        request.setEncoding("utf8");
        let data = "";
        request.on("data", (chunk) => {
            data += chunk;
        });
        request.on("end", async () => {
            let temp = Url.parse(request.url);
            console.log(`req: ${temp.pathname}`);
            try {
                let h = handle[temp.pathname.toLowerCase()];
                if (h) {
                    let content = h.content;
                    if (typeof h.fn === "function")
                        content = h.fn(data, content);
                    response.writeHead(200, { "Content-Type": h.type });
                    if (content)
                        await write(response, content);
                }
                else
                    throw new Error(`not available: ${temp.pathname}`);
            }
            catch (ex) {
                console.error(`fail: ${ex.message || ex}`);
                response.writeHead(500);
            }
            finally {
                response.end();
            }
        });
    })
        .listen(config.port);
});
async function write(response, data) {
    return new Promise((resolve, reject) => {
        response.write(data, ex => {
            if (ex)
                reject(ex);
            else
                resolve();
        });
    });
}
//# sourceMappingURL=App.js.map