import express from "express"
import { $Enums, PrismaClient } from "@prisma/client"

interface ClassAttendeeSurnameQueryOrderByObject {
    attendanceRegisterStudent: {
        student: {
            surname: ArrangeOrder
        }
    }
}

interface ClassAttendeeOtherNamesQueryOrderByObject {
    attendanceRegisterStudent: {
        student: {
            otherNames: ArrangeOrder
        }
    }
}

type QueryOrderByObject = {
    attendanceRegisterStudent?: {
        student: {
            regno: ArrangeOrder
        }
    }
    crashCourseAttendance?: {
        course: {
            code: ArrangeOrder
        }
    }
} | (ClassAttendeeSurnameQueryOrderByObject | ClassAttendeeOtherNamesQueryOrderByObject)[]

type ArrangeBy = "classAttendeeName" | "classAttendeeRegno" | "classAttendeeCrashCourse"

type ArrangeOrder = "asc" | "desc"

interface ClassAttendeeRouteRequestBody {
    studentId: string
    status: "PRESENT" | "ABSENT"
    crashCourseId?: string
}

const ClassAttendeeRoute = express.Router()

ClassAttendeeRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.app.get("user-id")

    let classAttendancesCount = await prismaClient.classAttendance.findFirst({
        where: {
            attendanceRegisterLecturer: {
                lecturerId: lecturerId
            },
            status: $Enums.ClassAttendanceStatus.ONGOING
        },
        select: {
            id: true
        }
    })

    if (!classAttendancesCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "No class attendance started",
                code: 5000
            },
            data: null
        })
        return
    }

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let classAttendeeName = url.searchParams.get("classAttendeeName") || String()
    let classAttendeeRegno = url.searchParams.get("classAttendeeRegno") || String()
    let classAttendeeCrashCourse = url.searchParams.get("classAttendeeCrashCourse") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    let searchBy: ArrangeBy = "classAttendeeName"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["classAttendeeName", "classAttendeeRegno", "classAttendeeCrashCourse"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "classAttendeeName"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}

    if (searchBy == "classAttendeeName") {
        orderBy = [
            {
                attendanceRegisterStudent: {
                    student: {
                        surname: searchOrder
                    }
                }
            },
            {
                attendanceRegisterStudent: {
                    student: {
                        otherNames: searchOrder
                    }
                }
            }
        ]
    } else if (searchBy == "classAttendeeRegno") {
        orderBy = {
            attendanceRegisterStudent: {
                student: {
                    regno: searchOrder
                }
            }
        }
    } else {
        orderBy = {
            crashCourseAttendance: {
                course: {
                    code: "asc"
                }
            }
        }
    }

    const classAttendeesQuery = await prismaClient.classAttendee.findMany({
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        orderBy,
        where: {
            classAttendanceId: classAttendancesCount.id,
            crashCourseAttendance: classAttendeeCrashCourse ? {
                course: {
                    code: {
                        contains: classAttendeeCrashCourse,
                        mode: "insensitive"
                    }
                }
            } : undefined,
            attendanceRegisterStudent: {
                student: {
                    regno: {
                        contains: classAttendeeRegno,
                        mode: "insensitive"
                    },
                    OR: [
                        {
                            surname: {
                                contains: classAttendeeName,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                contains: classAttendeeName,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                in: classAttendeeName.split(/\s+/),
                                mode: "insensitive"
                            }
                        },
                        {
                            surname: {
                                in: classAttendeeName.split(/\s+/),
                                mode: "insensitive"
                            }
                        }
                    ]
                }
            }
        },
        select: {
            id: true,
            crashCourseAttendance: {
                select: {
                    course: {
                        select: {
                            code: true
                        }
                    }
                }
            },
            attendanceRegisterStudent: {
                select: {
                    student: {
                        select: {
                            regno: true,
                            otherNames: true,
                            surname: true
                        }
                    }
                }
            }
        }
    })

    let classAttendees = classAttendeesQuery.map(({ id, crashCourseAttendance, attendanceRegisterStudent }) => {
        let {
            regno,
            surname,
            otherNames
        } = attendanceRegisterStudent.student
        return ({
            id,
            regno,
            status: "PRESENT",
            name: `${surname} ${otherNames}`.toUpperCase(),
            crashCourse: crashCourseAttendance ? crashCourseAttendance.course.code : null
        })
    })

    res.status(200)
    res.json({
        ok: true,
        data: classAttendees,
        error: null
    })
})

ClassAttendeeRoute.post("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.app.get("user-id")

    let classAttendancesCount = await prismaClient.classAttendance.findFirst({
        where: {
            attendanceRegisterLecturer: {
                lecturerId: lecturerId
            },
            status: $Enums.ClassAttendanceStatus.ONGOING
        },
        select: {
            id: true,
            attendanceRegisterId: true,
            attendanceRegister: {
                select: {
                    session: true
                }
            },
            date: true,
            endTime: true,
            startTime: true,

        }
    })

    if (!classAttendancesCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "No class attendance started",
                code: 5000
            },
            data: null
        })
        return
    }

    let body: ClassAttendeeRouteRequestBody | null = req.body || {}

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

    if (!body.studentId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'studentId'",
                code: 4028
            },
            data: null
        })
        return
    }

    if (!body.status) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'status'",
                code: 4029
            },
            data: null
        })
        return
    }

    if (!["PRESENT", "ABSENT"].includes(body.status)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid status format",
                code: 4030
            },
            data: null
        })
        return
    }

    let studentsCount = await prismaClient.student.count({
        where: {
            id: body.studentId
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

    if (body.crashCourseId) {
        let coursesCount = await prismaClient.course.count({
            where: {
                id: body.crashCourseId
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
    }

    if (body.status == "PRESENT") {
        let newAttendanceRegisterStudent = await prismaClient.attendanceRegisterStudent.upsert({
            where: {
                attendanceRegisterId_studentId: {
                    attendanceRegisterId: classAttendancesCount.attendanceRegisterId,
                    studentId: body.studentId
                }
            },
            update: {},
            create: {
                attendanceRegisterId: classAttendancesCount.attendanceRegisterId,
                studentId: body.studentId,
            },
            select: {
                id: true,
                studentId: true
            }
        })

        let { ...classAttendee } = await prismaClient.classAttendee.upsert({
            where: {
                classAttendanceId_attendanceRegisterStudentId: {
                    attendanceRegisterStudentId: newAttendanceRegisterStudent.id,
                    classAttendanceId: classAttendancesCount.id
                }
            },
            update: {},
            create: {
                attendanceRegisterStudentId: newAttendanceRegisterStudent.id,
                classAttendanceId: classAttendancesCount.id,
                crashCourseAttendance: body.crashCourseId ? {
                    create: {
                        courseId: body.crashCourseId,
                        session: classAttendancesCount.attendanceRegister.session,
                        date: classAttendancesCount.date,
                        startTime: classAttendancesCount.startTime,
                        endTime: classAttendancesCount.endTime,
                        studentId: newAttendanceRegisterStudent.studentId
                    }
                } : undefined
            },
            select: {
                id: true,
                crashCourseAttendance: {
                    select: {
                        course: {
                            select: {
                                code: true
                            }
                        }
                    }
                },
                attendanceRegisterStudent: {
                    select: {
                        student: {
                            select: {
                                regno: true,
                                otherNames: true,
                                surname: true
                            }
                        }
                    }
                }
            }
        })

        let {
            attendanceRegisterStudent: {
                student:
                {
                    regno,
                    surname: studentSurname,
                    otherNames: studentOtherNames
                }
            },
            crashCourseAttendance,
            id: presentClassAttendeeId
        } = classAttendee

        res.status(200)
        res.json({
            ok: true,
            data: {
                id: presentClassAttendeeId,
                status: "PRESENT",
                regno,
                name: `${studentSurname} ${studentOtherNames}`.toUpperCase(),
                crashCourse: crashCourseAttendance ? crashCourseAttendance.course.code : null
            },
            error: null
        })
        return
    } else if (body.status == "ABSENT") {
        let classAttendeeFirstEntry = await prismaClient.classAttendee.findFirst({
            where: {
                attendanceRegisterStudent: {
                    studentId: body.studentId
                },
                classAttendanceId: classAttendancesCount.id
            },
            select: {
                attendanceRegisterStudentId: true
            }
        })

        if (!classAttendeeFirstEntry) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Class attendee not found",
                    code: 4031
                },
                data: null
            })
            return
        }

        let { ...classAttendee } = await prismaClient.classAttendee.delete({
            where: {
                classAttendanceId_attendanceRegisterStudentId: {
                    attendanceRegisterStudentId: classAttendeeFirstEntry.attendanceRegisterStudentId,
                    classAttendanceId: classAttendancesCount.id
                }
            },
            select: {
                id: true,
                crashCourseAttendance: {
                    select: {
                        course: {
                            select: {
                                code: true
                            }
                        }
                    }
                },
                attendanceRegisterStudent: {
                    select: {
                        student: {
                            select: {
                                regno: true,
                                otherNames: true,
                                surname: true
                            }
                        }
                    }
                }
            }
        })

        let {
            attendanceRegisterStudent: {
                student:
                {
                    regno,
                    surname: studentSurname,
                    otherNames: studentOtherNames
                }
            },
            crashCourseAttendance,
            id: presentClassAttendeeId
        } = classAttendee

        res.status(200)
        res.json({
            ok: true,
            data: {
                id: presentClassAttendeeId,
                status: "ABSENT",
                regno,
                name: `${studentSurname} ${studentOtherNames}`.toUpperCase(),
                crashCourse: crashCourseAttendance ? crashCourseAttendance.course.code : null
            },
            error: null
        })
        return
    }

    res.status(400)
    res.json({
        ok: false,
        error: {
            message: "Invalid status format",
            code: 4030
        },
        data: null
    })
})

ClassAttendeeRoute.delete("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.app.get("user-id")

    let classAttendancesCount = await prismaClient.classAttendance.findFirst({
        where: {
            attendanceRegisterLecturer: {
                lecturerId: lecturerId
            },
            status: $Enums.ClassAttendanceStatus.ONGOING
        },
        select: {
            id: true
        }
    })

    if (!classAttendancesCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "No class attendance started",
                code: 5000
            },
            data: null
        })
        return
    }

    let body: { ClassAttendeesId: string[] } = req.body || {}

    body.ClassAttendeesId = body.ClassAttendeesId || []

    await prismaClient.classAttendee.deleteMany({
        where: {
            id: {
                in: body.ClassAttendeesId
            },
            classAttendanceId: classAttendancesCount.id
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: null,
        error: null
    })
})

export default ClassAttendeeRoute

