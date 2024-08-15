import express from "express"
import { authAccess } from "../../middleware/index.js"
import ClassAttendanceRoute from "./class-attendance/index.js"
import VerifyFaceRoute from "./verify-face.js"
import { PrismaClient } from "@prisma/client"

interface StudentRequestBody {
    password?: string
}

const StudentRoute = express.Router()

StudentRoute.use(authAccess("STUDENT"))

StudentRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let userId = req.app.get("user-id")

    let student = await prismaClient.student.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            user: {
                select: {
                    refreshToken: true
                }
            },
            regno: true,
            level: true,
            password: true,
            department: {
                select: {
                    name: true,
                    faculty: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            createdAt: true,
            updatedAt: true
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

    const {
        id,
        surname,
        otherNames,
        password,
        regno,
        level,
        gender,
        user: {
            refreshToken
        },
        createdAt,
        updatedAt,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = student

    let faceImage = new URL(`/image/student-face/${userId}`, `http://${req.headers.host}`)

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            refreshToken,
            surname,
            otherNames,
            regno,
            password,
            faceImage,
            gender,
            level,
            createdAt,
            updatedAt,
            department: departmentName,
            faculty: facultyName
        },
        error: null
    })
})

StudentRoute.patch("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let userId = req.app.get("user-id")

    let studentsCount = await prismaClient.student.count({
        where: {
            id: userId
        }
    })

    if (studentsCount <= 0) {
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

    let body: StudentRequestBody = req.body || {}
    let updateData: Partial<StudentRequestBody> = {}

    if (body.password) {
        updateData.password = body.password
    }

    const student = await prismaClient.student.update({
        data: updateData,
        where: {
            id: userId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            regno: true,
            level: true,
            password: true,
            user: {
                select: {
                    refreshToken: true
                }
            },
            department: {
                select: {
                    name: true,
                    faculty: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            createdAt: true,
            updatedAt: true
        }
    })

    const {
        id,
        surname,
        otherNames,
        password,
        regno,
        level,
        gender,
        user: {
            refreshToken
        },
        createdAt,
        updatedAt,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = student

    let faceImage = new URL(`/image/student-face/${userId}`, `http://${req.headers.host}`)

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            surname,
            otherNames,
            refreshToken,
            regno,
            password,
            faceImage,
            gender,
            level,
            createdAt,
            updatedAt,
            department: departmentName,
            faculty: facultyName
        },
        error: null
    })
})

StudentRoute.use("/class-attendance", ClassAttendanceRoute)

StudentRoute.use("/verify-face", VerifyFaceRoute)

export default StudentRoute