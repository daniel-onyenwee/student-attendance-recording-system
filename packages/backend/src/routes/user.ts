import express from "express"

const UserRoute = express.Router()

UserRoute.get("/", (req, res) => {
    let userType = req.app.get("user-type")
    let userId = req.app.get("user-id")
    let userRefreshToken = req.app.get("user-refresh-token")

    res.status(200)
    res.json({
        ok: true,
        data: {
            refreshToken: userRefreshToken,
            id: userId,
            type: userType
        },
        error: null
    })
})

export default UserRoute