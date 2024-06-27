import express from "express"
import ClassAttendanceRoute from "./class-attendance/index.js"
import RegisterRoute from "./register.js"

const AttendanceRoute = express.Router()

AttendanceRoute.use("/register", RegisterRoute)

AttendanceRoute.use("/class-attendance", ClassAttendanceRoute)

export default AttendanceRoute