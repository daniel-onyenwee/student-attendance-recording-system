import express from "express"
import { attendanceRegisterDecisionExpressionTypeChecker, getCurrentSession } from "../../../../utils/index.js"
import { $Enums, PrismaClient } from "@prisma/client"
import RegisterIDRoute from "./[registerId]/index.js"

type ArrangeBy = "title" | "code" | "session" | "semester" | "updatedAt" | "createdAt" | "department" | "faculty" | "level"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "department" | "faculty">> & {
    department?: Partial<{
        name: ArrangeOrder,
        faculty: {
            name: ArrangeOrder,
        }
    }>
}

interface RegisterRequestBody {
    courseId: string
    session: string
    decision: any[]
    lecturerIds: string[]
    studentIds: string[]
}

const RegisterRoute = express.Router()

RegisterRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let code = url.searchParams.get("code") || String()
    let title = url.searchParams.get("title") || String()
    let level = url.searchParams.get("level") || String()
    let semester = url.searchParams.get("semester") || String()
    let session = url.searchParams.get("session") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    if (session) {
        session = /^(\d{4})\/(\d{4})$/.test(session) ? session : getCurrentSession()
    }

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["title", "code", "session", "semester", "updatedAt", "createdAt", "department", "faculty", "level"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}
    if (searchBy == "department") {
        orderBy = {
            department: {
                name: searchOrder
            }
        }
    } else if (searchBy == "faculty") {
        orderBy = {
            department: {
                faculty: {
                    name: searchOrder
                }
            }
        }
    } else {
        orderBy[searchBy] = searchOrder
    }

    const attendanceRegistersQuery = await prismaClient.attendanceRegister.findMany({
        where: {
            course: {
                title: {
                    contains: title,
                    mode: "insensitive"
                },
                code: {
                    contains: code,
                    mode: "insensitive"
                },
                semester: semester ? {
                    equals: semester as $Enums.Semester,
                } : undefined,
                level: level ? {
                    equals: level as $Enums.Level
                } : undefined,
                department: {
                    name: {
                        contains: department,
                        mode: "insensitive"
                    },
                    faculty: {
                        name: {
                            contains: faculty,
                            mode: "insensitive"
                        }
                    }
                }
            },
            session: {
                contains: session,
                mode: "insensitive"
            }
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
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
            createdAt: true,
            updatedAt: true,
        }
    })

    let attendanceRegisters = attendanceRegistersQuery.map(({ course: { department: { name: departmentName, faculty: { name: facultyName } }, ...otherCourseData }, ...otherData }) => {
        return ({
            department: departmentName,
            faculty: facultyName,
            ...otherCourseData,
            ...otherData
        })
    })

    res.status(200)
    res.json({
        ok: true,
        data: attendanceRegisters,
        error: null
    })
})

RegisterRoute.post("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let body: RegisterRequestBody | null = req.body

    if (!body || Object.keys(body || {}).length == 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Request body missing",
                code: 1004
            },
            data: null
        })
        return
    }

    if (!body.courseId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'courseId'",
                code: 4000
            },
            data: null
        })
        return
    }

    if (!body.session) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'session'",
                code: 4001
            },
            data: null
        })
        return
    }

    if (!body.decision) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'decision'",
                code: 4002
            },
            data: null
        })
        return
    }

    if (!body.lecturerIds) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'lecturerIds'",
                code: 4003
            },
            data: null
        })
        return
    }

    body.studentIds = body.studentIds || []

    /**
     * if (!body.studentIds) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'studentIds'",
                code: 4004
            },
            data: null
        })
        return
    }
     */

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

    const attendanceRegistersCountByCourseIdSession = await prismaClient.attendanceRegister.count({
        where: {
            session: body.session,
            courseId: body.courseId
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

    let filteredLecturerIds = (await prismaClient.lecturer.findMany({
        where: {
            id: {
                in: body.lecturerIds
            }
        },
        select: {
            id: true
        }
    })).map(({ id }) => ({ lecturerId: id }))

    let filteredStudentIds = (await prismaClient.student.findMany({
        where: {
            id: {
                in: body.studentIds
            }
        },
        select: {
            id: true
        }
    })).map(({ id }) => ({ studentId: id }))

    const attendanceRegister = await prismaClient.attendanceRegister.create({
        data: {
            decision: body.decision,
            courseId: body.courseId,
            session: body.session,
            attendanceRegisterLecturers: {
                createMany: {
                    data: filteredLecturerIds,
                    skipDuplicates: true
                }
            },
            attendanceRegisterStudents: {
                createMany: {
                    data: filteredStudentIds,
                    skipDuplicates: true
                }
            }
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
            createdAt: true,
            updatedAt: true,
        }
    })

    const {
        course: {
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
            department: departmentName,
            faculty: facultyName,
            ...otherCourseData,
            ...otherData
        },
        error: null
    })
})

RegisterRoute.use("/", RegisterIDRoute)

export default RegisterRoute