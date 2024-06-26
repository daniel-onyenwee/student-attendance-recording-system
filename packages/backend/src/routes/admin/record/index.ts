import express from "express"
import FacultyRoute from "./faculty/index.js"
import DepartmentRoute from "./department/index.js"
import CourseRoute from "./course/index.js"
import LecturerRoute from "./lecturer/index.js"
import StudentRoute from "./student/index.js"

const RecordRoute = express.Router()

RecordRoute.use("/faculty", FacultyRoute)

RecordRoute.use("/department", DepartmentRoute)

RecordRoute.use("/course", CourseRoute)

RecordRoute.use("/lecturer", LecturerRoute)

RecordRoute.use("/student", StudentRoute)

export default RecordRoute