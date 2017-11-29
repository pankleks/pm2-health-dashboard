"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Http = require("http");
const Url = require("url");
const Fs = require("fs");
const Qs = require("querystring");
const Pmx = require("pmx");
const Storage_1 = require("./Storage");
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
    let storage = new Storage_1.Storage(config);
    storage.load();
    let handle = {
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
                storage.apply(JSON.parse(data));
            }
        },
        "/data": {
            type: "application/json",
            fn: () => JSON.stringify(storage.hosts)
        },
        "/app": {
            type: "application/json",
            fn: (data) => {
                let input = JSON.parse(data);
                if (input.host in storage.hosts && input.appId in storage.hosts[input.host].app)
                    return JSON.stringify(storage.hosts[input.host].app[input.appId]);
                throw new Error(`no host/app`);
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
                    let input = Qs.parse(temp.query), content = h.content;
                    if (typeof h.fn === "function")
                        content = h.fn(data, input, content);
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