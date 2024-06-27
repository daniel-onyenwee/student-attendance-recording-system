import express from "express"
import FacultyRoute from "./faculty.js"
import DepartmentRoute from "./department.js"
import CourseRoute from "./course.js"
import LecturerRoute from "./lecturer.js"
import StudentRoute from "./student.js"

const RecordRoute = express.Router()

RecordRoute.use("/faculty", FacultyRoute)

RecordRoute.use("/department", DepartmentRoute)

RecordRoute.use("/course", CourseRoute)

RecordRoute.use("/lecturer", LecturerRoute)

RecordRoute.use("/student", StudentRoute)

export default RecordRoute