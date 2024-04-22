import express from "express"
import bodyParser from "body-parser"
import ProcessRoute from "./routes/process.js"
import { auth, notFound } from "./middleware/index.js"

const AppRoute = express()

AppRoute.use(bodyParser.json())

AppRoute.use(bodyParser.urlencoded({ extended: true }))

AppRoute.use(auth())

AppRoute.use("/process", ProcessRoute)

AppRoute.get("/", (_, res) => {
    res.redirect("/process")
})

AppRoute.use(notFound())

export default AppRoute