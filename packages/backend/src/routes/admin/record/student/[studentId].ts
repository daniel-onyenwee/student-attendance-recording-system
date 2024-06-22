import { $Enums } from "@prisma/client"
import express from "express"
import { idValidator } from "../../../../middleware/index.js"
import { FaceRecognitionAPI, prismaClient } from "../../../../utils/index.js"

interface StudentIDRequestBody {
    surname: string
    otherNames: string
    gender: $Enums.Gender
    regno: string
    password: string
    departmentId: string
    level: $Enums.Level
}

const StudentIDRoute = express.Router()

StudentIDRoute.get("/:studentId", idValidator("studentId"), async (req, res) => {
    let studentId = req.params.studentId

    let student = await prismaClient.student.findUnique({
        where: {
            id: studentId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
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
        createdAt,
        updatedAt,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = student

    let faceImage = new URL(`/image/student-face/${studentId}`, `http://${req.headers.host}`)

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
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

// Set a minimum size of the image to upload
StudentIDRoute.post("/:studentId/face-image", idValidator("studentId"), async (req, res) => {
    let studentId = req.params.studentId
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

    let faceDetectionResult = await FaceRecognitionAPI.detectFace(faceImageBase64Data)

    const faceDetectedCount = faceDetectionResult.data ? faceDetectionResult.data.face_count : 0

    if (faceDetectedCount < 1) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "No face detected",
                code: 3025
            },
            data: null
        })
        return
    }

    if (faceDetectedCount > 1) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "More than 1 faces detected",
                code: 3026
            },
            data: null
        })
        return
    }

    await prismaClient.studentFace.upsert({
        where: {
            studentId,
        },
        update: {
            image: faceImageBase64Data,
            mineType: faceImageFile.mimetype
        },
        create: {
            studentId,
            image: faceImageBase64Data,
            mineType: faceImageFile.mimetype
        }
    })

    let faceImageUrl = new URL(`/image/student-face/${studentId}`, `http://${req.headers.host}`)
    res.status(200)
    res.json({
        ok: true,
        data: {
            faceImage: faceImageUrl
        },
        error: null
    })
})

StudentIDRoute.patch("/:studentId", idValidator("studentId"), async (req, res) => {
    let studentId = req.params.studentId

    let studentsCount = await prismaClient.student.findUnique({
        where: {
            id: studentId
        },
        select: {
            department: {
                select: {
                    levels: true
                }
            }
        }
    })

    if (!studentsCount) {
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

    let body: StudentIDRequestBody = req.body || {}
    let updateData: Partial<StudentIDRequestBody> = {}

    if (body.departmentId) {
        const departmentsCount = await prismaClient.department.count({
            where: {
                id: body.departmentId
            }
        })

        if (departmentsCount <= 0) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Department not found",
                    code: 3006
                },
                data: null
            })
            return
        }

        updateData.departmentId = body.departmentId
    }

    if (body.regno) {
        const studentsCountByRegno = await prismaClient.student.count({
            where: {
                regno: body.regno,
                id: {
                    not: {
                        equals: studentId
                    }
                }
            }
        })

        if (studentsCountByRegno > 0) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Regno already exist",
                    code: 3022
                },
                data: null
            })
            return
        }

        updateData.regno = body.regno
    }

    if (body.surname) {
        updateData.surname = body.surname.toUpperCase()
    }

    if (body.otherNames) {
        updateData.otherNames = body.otherNames.toUpperCase()
    }

    if (body.password) {
        updateData.password = body.password
    }

    if (body.gender) {
        if (!["MALE", "FEMALE"].includes(body.gender)) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Invalid gender format",
                    code: 3019
                },
                data: null
            })
            return
        }

        updateData.gender = body.gender
    }

    if (body.level) {
        if (!/L_(100|200|300|400|500|600|700|800|900|1000)/.test(body.level)) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Invalid level format",
                    code: 3011
                },
                data: null
            })
            return
        }

        if (!studentsCount.department.levels.includes(body.level as $Enums.Level)) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Level not supported",
                    code: 3014
                },
                data: null
            })
            return
        }

        updateData.level = body.level
    }

    const student = await prismaClient.student.update({
        data: updateData,
        where: {
            id: studentId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
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

    const {
        id,
        surname,
        otherNames,
        password,
        regno,
        level,
        gender,
        createdAt,
        updatedAt,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = student

    let faceImage = new URL(`/image/student-face/${studentId}`, `http://${req.headers.host}`)

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
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

StudentIDRoute.delete("/:studentId", idValidator("studentId"), async (req, res) => {
    let studentId = req.params.studentId

    let studentsCount = await prismaClient.student.count({
        where: {
            id: studentId
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

    let user = await prismaClient.user.delete({
        where: {
            id: studentId
        },
        select: {
            id: true,
            students: {
                select: {
                    surname: true,
                    gender: true,
                    otherNames: true,
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
            }
        }
    })

    const { id, students: [studentData] } = user
    const {
        surname,
        otherNames,
        password,
        regno,
        level,
        gender,
        createdAt,
        updatedAt,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = studentData

    let faceImage = new URL(`/image/student-face/${studentId}`, `http://${req.headers.host}`)

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            password,
            regno,
            faceImage,
            level,
            gender,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

export default StudentIDRoute