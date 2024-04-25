import express from "express"
import { idValidator } from "../../../../middleware/index.js"
import { prismaClient } from "../../../../utils/index.js"
import { $Enums } from "@prisma/client"

interface LecturerIDRequestBody {
    surname: string
    otherNames: string
    gender: $Enums.Gender
    username: string
    password: string
    departmentId: string
}

const LecturerIDRoute = express.Router()

LecturerIDRoute.get("/:lecturerId", idValidator("lecturerId"), async (req, res) => {
    let lecturerId = req.params.lecturerId

    let lecturer = await prismaClient.lecturer.findUnique({
        where: {
            id: lecturerId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            username: true,
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

    const { id, surname, otherNames, password, username, gender, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = lecturer

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            username,
            password,
            gender,
            createdAt,
            updatedAt,
            department: departmentName,
            facultyName: facultyName
        },
        error: null
    })
})

LecturerIDRoute.patch("/:lecturerId", idValidator("lecturerId"), async (req, res) => {
    let lecturerId = req.params.lecturerId

    let lecturersCount = await prismaClient.lecturer.count({
        where: {
            id: lecturerId
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

    let body: LecturerIDRequestBody = req.body || {}
    let updateData: Partial<LecturerIDRequestBody> = {}

    if (body.username) {
        const lecturersCountByUsername = await prismaClient.lecturer.count({
            where: {
                username: body.username,
                id: {
                    not: {
                        equals: lecturerId
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

    let lecturer = await prismaClient.lecturer.update({
        where: {
            id: lecturerId
        },
        data: body,
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            username: true,
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

    const { id, surname, otherNames, password, username, gender, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = lecturer

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            username,
            password,
            gender,
            createdAt,
            updatedAt,
            department: departmentName,
            facultyName: facultyName
        },
        error: null
    })
})

LecturerIDRoute.delete("/:lecturerId", idValidator("lecturerId"), async (req, res) => {
    let lecturerId = req.params.lecturerId

    let lecturersCount = await prismaClient.lecturer.count({
        where: {
            id: lecturerId
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

    let lecturer = await prismaClient.user.delete({
        where: {
            id: lecturerId
        },
        select: {
            id: true,
            lecturers: {
                select: {
                    surname: true,
                    gender: true,
                    otherNames: true,
                    username: true,
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

    const { id, lecturers: [lecturerData] } = lecturer
    const { surname, otherNames, password, username, gender, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = lecturerData

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            username,
            password,
            gender,
            createdAt,
            updatedAt,
            department: departmentName,
            facultyName: facultyName
        },
        error: null
    })
})

export default LecturerIDRoute