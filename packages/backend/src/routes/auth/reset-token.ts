import express from "express"
import "dotenv/config"
import jwt from "jsonwebtoken"
import { addDays, subHours } from "date-fns"

const ResetTokenRoute = express.Router()

ResetTokenRoute.post("/", (req, res) => {
    let refreshToken = req.app.get("user-refresh-token")
    /**
     * 1 hour is subtract from expire date to ensure 
     * the client request for a new access token before
     * it current access token expire
     */
    let expiresIn = subHours(addDays(new Date(), 1), 1).getTime()
    let userId = req.app.get("user-id")
    let accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET || "secret", { expiresIn: "1d" })

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

export default ResetTokenRoute