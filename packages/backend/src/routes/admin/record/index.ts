import express from "express"
import FacultyRoute from "./faculty/index.js"
import DepartmentRoute from "./department/index.js"
import CourseRoute from "./course/index.js"

const RecordRoute = express.Router()

RecordRoute.use("/faculty", FacultyRoute)

RecordRoute.use("/department", DepartmentRoute)

RecordRoute.use("/course", CourseRoute)

export default RecordRoute