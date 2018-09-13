
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

async function json<T>(path: string, data?: any) {
    let
        init: any = {
            credentials: "same-origin",
            method: "GET"
        };

    if (data != null) {
        init.method = "POST";
        init.body = JSON.stringify(data)
    }

    let
        resp = await fetch(path, init);
    if (resp.ok)
        return <T>(await resp.json());

    throw new Error(`fetch ${path} failed -> ${resp.statusText}`);
}

function parseQS(qs: string) {
    let
        obj = {};

    if (qs)
        for (let temp of qs.substr(1).split("&")) {
            let
                match = /([^=]+)=(.*)/.exec(temp);
            if (match)
                obj[match[1]] = decodeURIComponent(match[2]);
        }

    return <any>obj;
}

interface IValue {
    v: any;
    bad?: boolean;
}

interface IApp {
    id: number;
    name: string;
    inactive: boolean;
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