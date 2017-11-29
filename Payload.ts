export interface IValue {
    v: any;
    bad?: boolean;
}

export interface IPayload {
    token?: string;
    host: string,
    timeStamp?: number,
    app: {
        [appId: number]: {
            name: string;
            metric: {
                [key: string]: IValue;
            }
        }
    }
}