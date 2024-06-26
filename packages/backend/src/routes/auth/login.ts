import express from "express"
import "dotenv/config"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { addDays, subHours } from "date-fns"


interface LoginRequestBody {
    type: "LECTURER" | "ADMIN" | "STUDENT"
    username: string
    password: string
}

interface AuthData {
    password: string
    id: string
    user: {
        refreshToken: string
    }
}

const LoginRoute = express.Router()

LoginRoute.post("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let body: LoginRequestBody | null = req.body

    if (!body || Object.keys(body || {}).length == 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Request body missing",
                code: 1004
            },
            data: null
        })
        return
    }

    if (!body.type) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'type'",
                code: 2000
            },
            data: null
        })
        return
    }

    if (!body.username) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'username'",
                code: 2001
            },
            data: null
        })
        return
    }

    if (!body.password) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'password'",
                code: 2002
            },
            data: null
        })
        return
    }

    if (!["LECTURER", "ADMIN", "STUDENT"].includes(body.type)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid user type",
                code: 2003
            },
            data: null
        })
        return
    }

    let authData: AuthData | null = null

    if (body.type == "ADMIN") {
        authData = await prismaClient.admin.findUnique({
            where: { username: body.username },
            select: {
                password: true,
                id: true,
                user: {
                    select: {
                        refreshToken: true
                    }
                }
            }
        })
    } else if (body.type == "LECTURER") {
        authData = await prismaClient.lecturer.findUnique({
            where: { username: body.username },
            select: {
                password: true,
                id: true,
                user: {
                    select: {
                        refreshToken: true
                    }
                }
            }
        })
    } else if (body.type == "STUDENT") {
        authData = await prismaClient.student.findUnique({
            where: { regno: body.username },
            select: {
                password: true,
                id: true,
                user: {
                    select: {
                        refreshToken: true
                    }
                }
            }
        })
    }

    if (!authData) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Username not found",
                code: 2004
            },
            data: null
        })
        return
    }

    if (authData.password != body.password) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Incorrect password",
                code: 2005
            },
            data: null
        })
        return
    }

    const { id, user: { refreshToken } } = authData
    /**
         * 1 hour is subtract from expire date to ensure 
         * the client request for a new access token before
         * it current access token expire
         */
    let expiresIn = subHours(addDays(new Date(), 1), 1).getTime()
    const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET || "secret", { expiresIn: "1d" })

    res.status(200)
    res.json({
        ok: true,
        data: {
            refreshToken,
            accessToken,
            expiresIn
        },
        error: null
    })
})

export default LoginRoute