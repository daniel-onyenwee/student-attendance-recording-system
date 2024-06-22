import express from "express"
import { FaceRecognitionAPI, prismaClient } from "../../utils/index.js"

const VerifyFaceRoute = express.Router()

VerifyFaceRoute.post("/", async (req, res) => {
    let userId = req.app.get("user-id")

    let files = req.files

    if (!files) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'faceImage'",
                code: 3024
            },
            data: null
        })
        return
    }

    let faceImageFile = files.faceImage

    if (!faceImageFile) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'faceImage'",
                code: 3024
            },
            data: null
        })
        return
    }

    if (Array.isArray(faceImageFile)) {
        faceImageFile = faceImageFile[0]
    }

    if (!faceImageFile) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'faceImage'",
                code: 3024
            },
            data: null
        })
        return
    }

    let faceImageBase64Data = faceImageFile.data.toString("base64")

    let student = await prismaClient.student.findUnique({
        where: {
            id: userId
        },
        select: {
            studentFace: {
                select: {
                    image: true
                }
            }
        }
    })

    if (!student) {
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

    let studentFace = student.studentFace

    if (!studentFace) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Student face not found",
                code: 6000
            },
            data: null
        })
        return
    }

    let knowFaceImageBase64Data = studentFace.image

    let faceRecognitionResult = await FaceRecognitionAPI.recognizeFace(faceImageBase64Data, knowFaceImageBase64Data)

    if (faceRecognitionResult.ok) {
        res.status(200)
        res.json({
            ok: true,
            error: null,
            data: null
        })
    } else {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Faces doesn't match",
                code: 6001
            },
            data: null
        })
    }
})

export default VerifyFaceRoute