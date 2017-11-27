import * as Http from "http";
import * as Url from "url";
import * as Fs from "fs";

let
    history = {
        "Pulsar.Backend:1": {
        },
        "Pulsar.Backend:2": {
        },
        "Pulsar.Executor:3": {
        }
    },
    handle = {
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
            fn: (data) => {
                history = JSON.parse(data);
            }
        },
        "/data": {
            type: "application/json",
            fn: () => JSON.stringify(history)
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
                        content = h.content;
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
                response.writeHead(500, `fail: ${temp.pathname}, ${ex.message || ex}`, {});
            }
            finally {
                response.end();
            }

        });
    })
    .listen(8888);

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