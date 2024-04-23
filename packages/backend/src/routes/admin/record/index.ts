import express from "express"
import FacultyRoute from "./faculty/index.js"

const RecordRoute = express.Router()

RecordRoute.use("/faculty", FacultyRoute)

export default RecordRoute