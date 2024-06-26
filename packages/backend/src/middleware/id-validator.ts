import { NextFunction, Request, Response } from "express"
import { validate } from "uuid"

export default function idValidator(idName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!(idName in req.params)) {
            next()
        }

        let id = req.params[idName]

        if (!validate(id)) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Invalid id format",
                    code: 2007
                },
                data: null
            })
            return
        }

        next()
    }
}