import { app, setup } from "../server/app";

let initialized = false;

export default async function handler(req: any, res: any) {
    if (!initialized) {
        await setup();
        initialized = true;
    }
    app(req, res);
}
