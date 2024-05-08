import express from "express"
import { idValidator } from "../../../middleware/index.js"
import { prismaClient } from "../../../utils/index.js"
import jwt from "jsonwebtoken"
import "dotenv/config"

const CourseRoute = express.Router()

CourseRoute.get("/:courseId/:session", idValidator("courseId"), async (req, res) => {
    let courseId = req.params.courseId
    let session = req.params.session

    if (!/^(\d{4})\/(\d{4})$/.test(session)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid session format",
                code: 4005
            },
            data: null
        })
        return
    }

    const courseCount = await prismaClient.course.count({
        where: {
            id: courseId
        }
    })

    if (courseCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Course not found",
                code: 3015
            },
            data: null
        })
        return
    }

    const jwtPayload = {
        recordType: "COURSE",
        recordData: {
            courseId,
            session
        }
    }

    const reportAccessToken = jwt.sign(jwtPayload, process.env.REPORT_ACCESS_TOKEN_SECRET || "report_secret", { expiresIn: "1d" })

    const reportUrl = new URL(`/report?access_token=${reportAccessToken}`, `http://${req.headers.host}`)

    res.status(200)
    res.json({
        ok: true,
        data: {
            reportUrl
        },
        error: null
    })
})

export default CourseRoute