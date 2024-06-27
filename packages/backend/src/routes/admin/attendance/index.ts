import express from "express"
import RegisterRoute from "./register/index.js"
import ClassAttendanceRoute from "./class-attendance/index.js"

const AttendanceRoute = express.Router()

AttendanceRoute.use("/register", RegisterRoute)

AttendanceRoute.use("/class-attendance", ClassAttendanceRoute)

export default AttendanceRoute