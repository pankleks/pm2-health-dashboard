"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
class Storage {
    constructor(_config) {
        this._config = _config;
        this._hosts = {};
        if (!this._config.path)
            this._config.path = "./";
        if (this._config.maxHistory == null)
            this._config.maxHistory = 1440; // ~1d
    }
    get hosts() {
        return this._hosts;
    }
    apply(payload) {
        if (!payload.token || this._config.tokens.indexOf(payload.token) === -1)
            throw new Error(`not authenticated`);
        if (!payload.host)
            throw new Error(`no host`);
        let host = this._hosts[payload.host];
        if (!host)
            host = this._hosts[payload.host] = {
                host: payload.host,
                timeStamp: payload.timeStamp,
                app: {}
            };
        for (let appId in payload.app) {
            let app = host.app[appId];
            if (!app)
                app = host.app[appId] = {
                    name: payload.app[appId].name,
                    metric: {}
                };
            for (let key in payload.app[appId].metric) {
                let v = payload.app[appId].metric[key].v, metric = app.metric[key];
                if (!metric)
                    metric = app.metric[key] = { history: [] };
                metric.v = v;
                if (payload.app[appId].metric[key].history) {
                    metric.history.push(v);
                    if (metric.history.length > this._config.maxHistory)
                        metric.history.shift();
                }
            }
        }
        if (this._config.persist)
            Fs.writeFile(Path.join(this._config.path, `host_${host.host}.json`), JSON.stringify(host), "utf8", ex => {
                if (ex)
                    console.error(`failed to store ${host.host}: ${ex.message || ex}`);
            });
    }
    load() {
        if (!this._config.persist)
            return;
        for (let f of Fs.readdirSync(this._config.path))
            if (/host_.+\.json/.test(f))
                try {
                    let host = JSON.parse(Fs.readFileSync(Path.join(this._config.path, f), "utf8"));
                    if (!host.host)
                        throw new Error(`no host`);
                    this._hosts[host.host] = host;
                    console.log(`loaded host ${host.host}`);
                }
                catch (ex) {
                    console.error(`failed to load ${f}: ${ex.message || ex}`);
                }
    }
}
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map