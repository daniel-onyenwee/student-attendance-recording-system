import { NextFunction, Request, Response } from "express"

/**
 * Page not found handler
 */
export default function notFound() {
    return function (_: Request, res: Response, next: NextFunction) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid API method",
                code: 1000
            },
            data: null
        })

        next()
    }
}