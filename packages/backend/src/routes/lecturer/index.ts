import express from "express"
import { authAccess } from "../../middleware/index.js"
import AttendanceRoute from "./attendance/index.js"
import { PrismaClient } from "@prisma/client"

const LecturerRoute = express.Router()

interface LecturerRequestBody {
    username?: string
    password?: string
}

LecturerRoute.use(authAccess("LECTURER"))

LecturerRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let userId = req.app.get("user-id")

    let lecturer = await prismaClient.lecturer.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            username: true,
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

    if (!lecturer) {
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

    const {
        surname,
        otherNames,
        user: {
            refreshToken
        },
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        },
        ...otherData
    } = lecturer
    res.status(200)
    res.json({
        ok: true,
        data: {
            name: `${surname} ${otherNames}`,
            refreshToken,
            faculty: facultyName,
            department: departmentName,
            ...otherData
        },
        error: null
    })
})

LecturerRoute.patch("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let userId = req.app.get("user-id")

    let lecturersCount = await prismaClient.lecturer.count({
        where: {
            id: userId
        }
    })

    if (lecturersCount <= 0) {
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

    let body: LecturerRequestBody = req.body || {}
    let updateData: Partial<LecturerRequestBody> = {}

    if (body.username) {
        const lecturersCountByUsername = await prismaClient.lecturer.count({
            where: {
                username: body.username,
                id: {
                    not: {
                        equals: userId
                    }
                }
            }
        })

        if (lecturersCountByUsername > 0) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Username already exist",
                    code: 2006
                },
                data: null
            })
            return
        }

        updateData.username = body.username
    }

    if (body.password) {
        updateData.password = body.password
    }

    let lecturer = await prismaClient.lecturer.update({
        where: {
            id: userId
        },
        data: body,
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            username: true,
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
        surname,
        otherNames,
        user: {
            refreshToken
        },
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        },
        ...otherData
    } = lecturer
    res.status(200)
    res.json({
        ok: true,
        data: {
            name: `${surname} ${otherNames}`,
            refreshToken,
            faculty: facultyName,
            department: departmentName,
            ...otherData
        },
        error: null
    })
})

LecturerRoute.use("/attendance", AttendanceRoute)

export default LecturerRoute