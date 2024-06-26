import { NextFunction, Request, Response } from "express"

/**
 * Prevent unauthorized user access to part of the system.
 * @param userType type of user authorized to access this system part.
 * @param ignorePaths list of path unauthorized user can access.
 */
export default function authAccess(userType: "ADMIN" | "LECTURER" | "STUDENT", ignorePaths: Array<RegExp | string> = []) {
    return function (req: Request, res: Response, next: NextFunction) {
        let url = new URL(req.url || String(), `http://${req.headers.host}`)

        for (const path of ignorePaths) {
            if (path instanceof RegExp) {
                if (path.test(url.pathname)) {
                    next()
                    return
                }
            } else if (typeof path == "string") {
                if (path == url.pathname) {
                    next()
                    return
                }
            }
        }

        let reqUserType = req.app.get("user-type")

        if (reqUserType != userType) {
            res.status(403)
            res.json({
                ok: false,
                error: {
                    message: "Unauthorized access",
                    code: 1003
                },
                data: null
            })
            return
        }

        next()
    }
}