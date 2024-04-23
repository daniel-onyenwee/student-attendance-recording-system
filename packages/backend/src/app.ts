import express from "express"
import bodyParser from "body-parser"
import ProcessRoute from "./routes/process.js"
import AuthRoute from "./routes/auth/index.js"
import AdminRoute from "./routes/admin/index.js"
import { onExit } from "signal-exit"
import { auth, notFound } from "./middleware/index.js"
import { prismaClient } from "./utils/index.js"

const AppRoute = express()

AppRoute.use(bodyParser.json())

AppRoute.use(bodyParser.urlencoded({ extended: true }))

AppRoute.use(auth())

AppRoute.use("/process", ProcessRoute)

AppRoute.use("/auth", AuthRoute)

AppRoute.use("/admin", AdminRoute)

AppRoute.get("/", (_, res) => {
    res.redirect("/process")
})

AppRoute.use(notFound())

onExit(() => {
    prismaClient.$disconnect()
})

export default AppRoute