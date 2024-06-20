import express from "express"
import StudentRoute from "./student.js"
import CourseRoute from "./course.js"

const RecordRoute = express.Router()

RecordRoute.use("/student", StudentRoute)

RecordRoute.use("/course", CourseRoute)

export default RecordRoute