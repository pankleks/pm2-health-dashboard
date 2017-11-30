"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const Path = require("path");
class Storage {
    constructor(_config) {
        this._config = _config;
        this._hosts = {};
        this._history = {};
        if (!this._config.path)
            this._config.path = "./";
        if (this._config.maxHistory == null)
            this._config.maxHistory = 1440; // ~1d
    }
    get hosts() {
        return this._hosts;
    }
    appData(host, appId) {
        let h = this.host(host), app = this._hosts[host].app[appId];
        if (!app)
            throw new Error(`no app`);
        let history = {};
        for (let key in app.metric)
            history[app.id + key] = this._history[host][app.id + key];
        return { app, history };
    }
    get history() {
        return this._history;
    }
    apply(payload) {
        if (!payload.token || this._config.tokens.indexOf(payload.token) === -1)
            throw new Error(`not authenticated`);
        if (!payload.host)
            throw new Error(`no host`);
        let host = this._hosts[payload.host];
        if (!host)
            host = this._hosts[payload.host] = {
                name: payload.host,
                timeStamp: payload.timeStamp,
                app: {}
            };
        if (!this._history[payload.host])
            this._history[payload.host] = {};
        for (let appId in payload.app) {
            let app = host.app[appId];
            if (!app)
                app = host.app[appId] = {
                    id: parseInt(appId),
                    name: payload.app[appId].name,
                    metric: {}
                };
            for (let key in payload.app[appId].metric) {
                let v = payload.app[appId].metric[key].v;
                app.metric[key] = v;
                if (payload.app[appId].metric[key].history)
                    this.pushV(host.name, app.id, key, v);
            }
        }
        if (this._config.persist)
            this.store(`host_${host.name}.json`, {
                host: host,
                history: this._history[host.name]
            });
    }
    pushV(host, appId, key, v) {
        let id = appId + key, h = this._history[host][id];
        if (!h)
            h = this._history[host][id] = [];
        h.push(v);
        if (h.length > this._config.maxHistory)
            h.shift();
    }
    load() {
        if (!this._config.persist)
            return;
        for (let f of Fs.readdirSync(this._config.path))
            if (/host_.+\.json/.test(f))
                try {
                    let temp = JSON.parse(Fs.readFileSync(Path.join(this._config.path, f), "utf8"));
                    this._hosts[temp.host.name] = temp.host;
                    this._history[temp.host.name] = temp.history;
                    console.log(`loaded host ${temp.host.name}`);
                }
                catch (ex) {
                    console.error(`failed to load ${f}: ${ex.message || ex}`);
                }
    }
    erase() {
        this._hosts = {};
        this._history = {};
    }
    store(name, data) {
        Fs.writeFile(Path.join(this._config.path, name), JSON.stringify(data), "utf8", ex => {
            if (ex)
                console.error(`failed to store ${name}: ${ex.message || ex}`);
        });
    }
    host(host) {
        let h = this._hosts[host];
        if (!h)
            throw new Error(`host ${host} not found`);
        return h;
    }
    deleteApp(host, appId) {
        let h = this.host(host);
        for (let key in h.app[appId].metric)
            delete this._history[host][appId + key];
        delete h.app[appId];
    }
}
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map