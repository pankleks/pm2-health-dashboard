import * as Http from "http";
import * as Url from "url";
import * as Fs from "fs";
import * as Qs from "querystring";
import * as Pmx from "pmx";
import { Storage, IStorageConfig } from "./Storage";

interface IConfig extends IStorageConfig {
    port: number;
}

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
}, (ex, config: IConfig) => {
    if (ex)
        process.exit(1);

    if (config.port == null)
        config.port = 8888;

    let
        storage = new Storage(config);

    storage.load();

    Pmx.action("erase", (reply) => {
        storage.erase();
        reply(`erased`);
    });

    let
        handle = {
            "/": {
                type: "text/html",
                content: Fs.readFileSync("Client/Dashboard.html", "utf8"),
            },
            "/app.html": {
                type: "text/html",
                content: Fs.readFileSync("Client/App.html", "utf8"),
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
                    let
                        input = JSON.parse(data);

                    return JSON.stringify(storage.appData(input.host, input.appId));
                }
            },
            "/app/delete": {
                type: "application/json",
                fn: (data) => {
                    let
                        input = JSON.parse(data);
                    storage.deleteApp(input.host, input.appId);
                }
            }
        };

    Http
        .createServer((request, response) => {
            request.setEncoding("utf8");

            let
                data = "";
            request.on("data", (chunk) => {
                data += chunk;
            });

            request.on("end", async () => {
                let
                    temp = Url.parse(request.url);

                console.log(`req: ${temp.pathname}`);

                try {
                    let
                        h = handle[temp.pathname.toLowerCase()];

                    if (h) {
                        let
                            input = Qs.parse(temp.query),
                            content = h.content;
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
                    await write(response, `fail: ${ex.message || ex}`);
                }
                finally {
                    response.end();
                }

            });
        })
        .listen(config.port);
});

async function write(response: Http.ServerResponse, data: string) {
    return new Promise((resolve, reject) => {
        response.write(data, ex => {
            if (ex)
                reject(ex);
            else
                resolve();
        });
    });
}