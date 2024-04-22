import express from "express"
import { PrismaClient } from "@prisma/client"
import "dotenv/config"
import jwt from "jsonwebtoken"

const ResetTokenRoute = express.Router()

ResetTokenRoute.post("/", (req, res) => {
    let refreshToken = req.app.get("user-refresh-token")
    let userId = req.app.get("user-id")
    let accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET || "secret", { expiresIn: "1d" })

    res.status(200)
    res.json({
        ok: true,
        data: {
            refresh_token: refreshToken,
            access_token: accessToken
        },
        error: null
    })
})

export default ResetTokenRoute