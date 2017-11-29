
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

interface IValue {
    v: any;
    bad?: boolean;
}

interface IApp {
    name: string;
    metric: {
        [key: string]: {
            v?: IValue;
            history: IValue[];
        }
    }
}

interface IHosts {
    [host: string]: {
        timeStamp: number;
        app: {
            [appId: number]: IApp
        }
    }
}