export interface IValue {
    v: any;
    bad?: boolean;
}

export interface IPayload {
    token?: string;
    host: string,
    timeStamp?: number,
    snapshot: {
        [pid: string]: {
            app: string;
            metric: {
                [key: string]: IValue;
            }
        }
    }
}