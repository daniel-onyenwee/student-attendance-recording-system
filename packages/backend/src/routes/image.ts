import express from "express"
import idValidator from "../middleware/id-validator.js"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { PrismaClient } from "@prisma/client"

const __dirname = dirname(fileURLToPath(import.meta.url))

const ImageRoute = express.Router()

ImageRoute.get("/student-face/:studentId", idValidator("studentId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let studentId = req.params.studentId

    let studentFace = await prismaClient.studentFace.findUnique({
        where: {
            studentId,
        }
    })

    if (!studentFace) {
        res.status(400)
        res.sendFile(join(__dirname, "../../public/blank-profile.png"))
        return
    }

    try {
        res.status(200)
        res.contentType(studentFace.mineType)
        res.send(Buffer.from(studentFace.image, "base64"))
    } catch (error) {
        res.status(400)
        res.sendFile(join(__dirname, "../../public/blank-profile.png"))
    }
})

export default ImageRoute