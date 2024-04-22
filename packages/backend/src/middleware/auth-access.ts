import { NextFunction, Request, Response } from "express"

/**
 * Prevent unauthorized user access to part of the system.
 * @param userType type of user authorized to access this system part.
 */
export default function authAccess(userType: "ADMIN" | "LECTURER" | "STUDENT") {
    return function (req: Request, res: Response, next: NextFunction) {
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