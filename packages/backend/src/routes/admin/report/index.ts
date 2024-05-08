import express from "express"
import CourseRoute from "./course.js"
import LecturerRoute from "./lecturer.js"
import StudentRoute from "./student.js"

const ReportRoute = express.Router()

ReportRoute.use("/course", CourseRoute)

ReportRoute.use("/lecturer", LecturerRoute)

ReportRoute.use("/student", StudentRoute)

export default ReportRoute