import express from "express"
import bodyParser from "body-parser"
import ProcessRoute from "./routes/process.js"
import AuthRoute from "./routes/auth/index.js"
import AdminRoute from "./routes/admin/index.js"
import LecturerRoute from "./routes/lecturer/index.js"
import StudentRoute from "./routes/student/index.js"
import ImageRoute from "./routes/image.js"
import UserRoute from "./routes/user.js"
import UtilsRoute from "./routes/utils/index.js"
import fileUpload from "express-fileupload"
import { auth, logger, notFound } from "./middleware/index.js"
import cors from "cors"

const AppRoute = express()

AppRoute.use(bodyParser.json())

AppRoute.use(bodyParser.urlencoded({ extended: true }))

AppRoute.use(cors())

AppRoute.use(auth())

AppRoute.use(fileUpload())

AppRoute.use(logger())

AppRoute.use("/process", ProcessRoute)

AppRoute.use("/auth", AuthRoute)

AppRoute.use("/admin", AdminRoute)

AppRoute.use("/lecturer", LecturerRoute)

AppRoute.use("/student", StudentRoute)

AppRoute.use("/utils", UtilsRoute)

AppRoute.use("/image", ImageRoute)

AppRoute.use("/user", UserRoute)

AppRoute.get("/", (_, res) => {
    res.redirect("/process")
})

AppRoute.use(notFound())

export default AppRoute