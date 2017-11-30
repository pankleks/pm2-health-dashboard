import * as Fs from "fs";
import * as Path from "path";
import { IValue, IPayload } from "./Payload";

export interface IStorageConfig {
    tokens: string[];
    persist: boolean;
    path: string;
    maxHistory: number;
}

interface IApp {
    id: number;
    name: string;
    metric: {
        [key: string]: IValue;
    }
}

interface IHosts {
    [host: string]: {
        name: string;
        timeStamp: number;
        app: {
            [appId: number]: IApp
        }
    }
}

interface IHistory {
    [appIdKey: string]: IValue[];
}

export class Storage {
    private _hosts: IHosts = {};
    private _history: {
        [host: string]: IHistory
    } = {};

    get hosts() {
        return this._hosts;
    }

    appData(host: string, appId: number) {
        if (!this._hosts[host])
            throw new Error(`no host`);
        let
            app = this._hosts[host].app[appId];
        if (!app)
            throw new Error(`no app`);
        let
            history = {};

        for (let key in app.metric)
            history[app.id + key] = this._history[host][app.id + key];

        return { app, history };
    }

    get history() {
        return this._history;
    }

    constructor(private _config: IStorageConfig) {
        if (!this._config.path)
            this._config.path = "./";
        if (this._config.maxHistory == null)
            this._config.maxHistory = 1440; // ~1d
    }

    apply(payload: IPayload) {
        if (!payload.token || this._config.tokens.indexOf(payload.token) === -1)
            throw new Error(`not authenticated`);

        if (!payload.host)
            throw new Error(`no host`);

        let
            host = this._hosts[payload.host];
        if (!host)
            host = this._hosts[payload.host] = {
                name: payload.host,
                timeStamp: payload.timeStamp,
                app: {}
            };

        if (!this._history[payload.host])
            this._history[payload.host] = {};

        for (let appId in payload.app) {
            let
                app = host.app[appId];
            if (!app)
                app = host.app[appId] = {
                    id: parseInt(appId),
                    name: payload.app[appId].name,
                    metric: {}
                };

            for (let key in payload.app[appId].metric) {
                let
                    v = payload.app[appId].metric[key].v;
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

    private pushV(host: string, appId: number, key: string, v: IValue) {
        let
            id = appId + key,
            h = this._history[host][id];
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
                    let
                        temp = JSON.parse(Fs.readFileSync(Path.join(this._config.path, f), "utf8"));

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

    private store(name: string, data) {
        Fs.writeFile(Path.join(this._config.path, name), JSON.stringify(data), "utf8", ex => {
            if (ex)
                console.error(`failed to store ${name}: ${ex.message || ex}`);
        });
    }
}
