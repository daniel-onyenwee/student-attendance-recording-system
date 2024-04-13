import express from "express"
import ProcessRoute from "./routes/process.js"

const AppRoute = express()

AppRoute.use("/process", ProcessRoute)

AppRoute.get("/", (_, res) => {
    res.redirect("/process")
})

export default AppRoute