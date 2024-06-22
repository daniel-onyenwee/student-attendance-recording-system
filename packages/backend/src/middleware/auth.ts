import { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

/**
 * Prevent unauthenticated access to the system.
 */
export default function auth() {
    return async function (req: Request, res: Response, next: NextFunction) {
        const prismaClient: PrismaClient = req.app.get("prisma-client")

        let url = new URL(req.url || String(), `http://${req.headers.host}`)
        let unauthorizedRoutes = ["/", "/process", "/auth/login", "/report"]

        if (unauthorizedRoutes.includes(url.pathname)) {
            next()
            return
        }

        if (url.pathname.startsWith("/image")) {
            next()
            return
        }

        const authHeader = req.header("authorization")
        const token = authHeader && authHeader.split(" ")[1]

        if (!token) {
            res.status(401)
            res.json({
                ok: false,
                error: {
                    message: "No authorization token",
                    code: 1001
                },
                data: null
            })
            return
        }

        if (url.pathname == "/auth/reset-token") {
            const user = await prismaClient.user.findUnique({
                where: {
                    refreshToken: token
                },
                select: {
                    id: true,
                    type: true,
                    refreshToken: true
                }
            })

            if (!user) {
                res.status(401)
                res.json({
                    ok: false,
                    error: {
                        message: "Invalid authorization token",
                        code: 1002
                    },
                    data: null
                })
                return
            }

            req.app.set("user-type", user.type)
            req.app.set("user-id", user.id)
            req.app.set("user-refresh-token", user.refreshToken)
            next()
            return
        }

        try {
            const jwtPayload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "secret") as JwtPayload
            let userId = jwtPayload.id

            if (!userId) {
                throw new Error()
            }

            const user = await prismaClient.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    id: true,
                    type: true,
                    refreshToken: true
                }
            })

            if (!user) {
                throw new Error()
            }

            req.app.set("user-type", user.type)
            req.app.set("user-id", user.id)
            req.app.set("user-refresh-token", user.refreshToken)
        } catch (error) {
            res.status(401)
            res.json({
                ok: false,
                error: {
                    message: "Invalid authorization token",
                    code: 1002
                },
                data: null
            })
            return
        }

        next()
    }
}