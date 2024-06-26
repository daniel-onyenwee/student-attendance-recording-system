import express from "express"
import RecordRoute from "./record/index.js"
import AttendanceRoute from "./attendance/index.js"

const StatsRoute = express.Router()

StatsRoute.use("/record", RecordRoute)

StatsRoute.use("/attendance", AttendanceRoute)

export default StatsRoute