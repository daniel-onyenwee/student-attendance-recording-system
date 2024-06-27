import express from "express"
import ClassAttendanceRoute from "./class-attendance.js"
import RegisterRoute from "./register.js"

const AttendanceRoute = express.Router()

AttendanceRoute.use("/class-attendance", ClassAttendanceRoute)

AttendanceRoute.use("/register", RegisterRoute)

export default AttendanceRoute