import express from "express"
import { idValidator } from "../../../middleware/index.js"
import jwt from "jsonwebtoken"
import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const LecturerRoute = express.Router()

LecturerRoute.get("/:lecturerId/:session", idValidator("lecturerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.params.lecturerId
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

    const lecturerCount = await prismaClient.lecturer.count({
        where: {
            id: lecturerId
        }
    })

    if (lecturerCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Lecturer not found",
                code: 3020
            },
            data: null
        })
        return
    }

    const jwtPayload = {
        recordType: "LECTURER",
        recordData: {
            lecturerId,
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

export default LecturerRoute