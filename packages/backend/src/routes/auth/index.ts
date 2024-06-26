import express from "express"
import LoginRoute from "./login.js"
import ResetTokenRoute from "./reset-token.js"

const AuthRoute = express.Router()

AuthRoute.use("/login", LoginRoute)

AuthRoute.use("/reset-token", ResetTokenRoute)

export default AuthRoute