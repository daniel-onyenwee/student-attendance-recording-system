import { NextFunction, Request, Response } from "express"

/**
 * Route logger
 */
export default function logger() {
    return function (req: Request, _: Response, next: NextFunction) {
        let loggerCallback = req.app.get("logger")

        if (loggerCallback) {
            loggerCallback(req.method, req.path)
        }

        next()
    }
}