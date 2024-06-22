import express from "express"
import { idValidator } from "../../../middleware/index.js"
import jwt from "jsonwebtoken"
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const StudentRoute = express.Router()

StudentRoute.get("/:studentId/:session", idValidator("studentId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let studentId = req.params.studentId
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

    const studentCount = await prismaClient.student.count({
        where: {
            id: studentId
        }
    })

    if (studentCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Student not found",
                code: 3023
            },
            data: null
        })
        return
    }

    const jwtPayload = {
        recordType: "STUDENT",
        recordData: {
            studentId,
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

export default StudentRoute