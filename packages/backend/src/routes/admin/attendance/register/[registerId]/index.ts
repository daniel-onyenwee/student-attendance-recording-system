import express from "express"
import { idValidator } from "../../../../../middleware/index.js"
import { attendanceRegisterDecisionExpressionTypeChecker } from "../../../../../utils/index.js"
import RegisterIDRecordRoute from "./record.js"
import { $Enums, PrismaClient } from "@prisma/client"
import RegisterIDAttendanceRoute from "./attendance.js"

interface RegisterIDRequestBody {
    courseId: string
    session: string
    decision: any[]
}

const RegisterIDRoute = express.Router()

RegisterIDRoute.get("/:registerId", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let attendanceRegister = await prismaClient.attendanceRegister.findUnique({
        where: {
            id: registerId
        },
        select: {
            id: true,
            decision: true,
            session: true,
            course: {
                select: {
                    title: true,
                    code: true,
                    semester: true,
                    level: true,
                    department: {
                        select: {
                            name: true,
                            faculty: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            },
            classAttendances: {
                orderBy: {
                    date: "asc"
                },
                where: {
                    status: $Enums.ClassAttendanceStatus.COMPLETED
                },
                select: {
                    id: true,
                    date: true,
                    startTime: true,
                    endTime: true
                }
            },
            createdAt: true,
            updatedAt: true,
        }
    })

    if (!attendanceRegister) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
        return
    }

    const {
        course: {
            title,
            code,
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            },
            ...otherCourseData
        },
        ...otherData
    } = attendanceRegister

    res.status(200)
    res.json({
        ok: true,
        data: {
            courseTitle: title,
            courseCode: code,
            ...otherCourseData,
            ...otherData,
            department: departmentName,
            faculty: facultyName
        },
        error: null
    })
})

RegisterIDRoute.patch("/:registerId", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.findUnique({
        where: {
            id: registerId
        },
        select: {
            courseId: true,
            session: true,
        }
    })

    if (!attendanceRegistersCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
        return
    }

    let body: RegisterIDRequestBody = req.body || {}
    let updateData: Partial<RegisterIDRequestBody> = {}

    if (body.courseId) {
        let coursesCount = await prismaClient.course.count({
            where: {
                id: body.courseId
            }
        })

        if (coursesCount <= 0) {
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

        updateData.courseId = body.courseId
    }

    if (body.session) {
        if (!/^(\d{4})\/(\d{4})$/.test(body.session)) {
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

        updateData.session = body.session
    }

    if (body.decision) {
        if (!Array.isArray(body.decision)) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Invalid decision format",
                    code: 4006
                },
                data: null
            })
            return
        }

        let decisionTypeChecking = attendanceRegisterDecisionExpressionTypeChecker(body.decision)

        if (decisionTypeChecking.status == "failed") {
            res.status(400)
            res.json({
                ok: false,
                error: decisionTypeChecking.error,
                data: null
            })
            return
        }

        updateData.decision = body.decision
    }

    if (updateData.courseId || updateData.session) {
        const attendanceRegistersCountByCourseIdSession = await prismaClient.attendanceRegister.count({
            where: {
                session: updateData.session || attendanceRegistersCount.session,
                courseId: updateData.courseId || attendanceRegistersCount.courseId,
                id: {
                    not: {
                        equals: registerId
                    }
                }
            }
        })

        if (attendanceRegistersCountByCourseIdSession > 0) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    code: 4014,
                    message: "Attendance register already exist"
                },
                data: null
            })
            return
        }
    }

    const attendanceRegister = await prismaClient.attendanceRegister.update({
        where: {
            id: registerId
        },
        data: {
            decision: updateData.decision,
            courseId: updateData.courseId,
            session: updateData.session,
        },
        select: {
            id: true,
            decision: true,
            session: true,
            classAttendances: {
                where: {
                    status: $Enums.ClassAttendanceStatus.COMPLETED
                },
                orderBy: {
                    date: "asc"
                },
                select: {
                    id: true,
                    date: true,
                    startTime: true,
                    endTime: true
                }
            },
            course: {
                select: {
                    title: true,
                    code: true,
                    semester: true,
                    level: true,
                    department: {
                        select: {
                            name: true,
                            faculty: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            },
            createdAt: true,
            updatedAt: true,
        }
    })

    const {
        course: {
            code,
            title,
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            }, ...otherCourseData
        },
        ...otherData
    } = attendanceRegister

    res.status(200)
    res.json({
        ok: true,
        data: {
            courseTitle: title,
            courseCode: code,
            department: departmentName,
            faculty: facultyName,
            ...otherCourseData,
            ...otherData
        },
        error: null
    })
})

RegisterIDRoute.delete("/:registerId", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            id: registerId
        }
    })

    if (attendanceRegistersCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
        return
    }

    const attendanceRegister = await prismaClient.attendanceRegister.delete({
        where: {
            id: registerId
        },
        select: {
            id: true,
            decision: true,
            session: true,
            classAttendances: {
                orderBy: {
                    date: "asc"
                },
                where: {
                    status: $Enums.ClassAttendanceStatus.COMPLETED
                },
                select: {
                    id: true,
                    date: true,
                    startTime: true,
                    endTime: true
                }
            },
            course: {
                select: {
                    title: true,
                    code: true,
                    semester: true,
                    level: true,
                    department: {
                        select: {
                            name: true,
                            faculty: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            },
            createdAt: true,
            updatedAt: true,
        }
    })

    const {
        course: {
            title,
            code,
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            }, ...otherCourseData
        },
        ...otherData
    } = attendanceRegister

    res.status(200)
    res.json({
        ok: true,
        data: {
            courseTitle: title,
            courseCode: code,
            department: departmentName,
            faculty: facultyName,
            ...otherCourseData,
            ...otherData
        },
        error: null
    })
})

RegisterIDRoute.use("/", RegisterIDAttendanceRoute)

RegisterIDRoute.use("/", RegisterIDRecordRoute)

export default RegisterIDRoute
