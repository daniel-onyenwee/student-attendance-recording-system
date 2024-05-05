import express from "express"
import RegisterRoute from "./register/index.js"

const AttendanceRoute = express.Router()

AttendanceRoute.use("/register", RegisterRoute)

export default AttendanceRoute