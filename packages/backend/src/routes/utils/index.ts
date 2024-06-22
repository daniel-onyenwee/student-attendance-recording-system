import express from "express"
import RecordRoute from "./record/index.js"

const UtilsRoute = express.Router()

UtilsRoute.use("/record", RecordRoute)

export default UtilsRoute