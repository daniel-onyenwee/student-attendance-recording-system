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

type ArrangeBy = "name" | "regno" | "crashCourse"

type ArrangeOrder = "asc" | "desc"

interface ClassAttendeeRouteRequestBody {
    classAttendees: {
        studentId: string
        crashCourseId?: string
    }[]
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
    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()
    let crashCourse = url.searchParams.get("crashCourse") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    let searchBy: ArrangeBy = "name"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "regno", "crashCourse"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "name"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}

    if (searchBy == "name") {
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
    } else if (searchBy == "regno") {
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
            crashCourseAttendance: crashCourse ? {
                course: {
                    code: {
                        contains: crashCourse,
                        mode: "insensitive"
                    }
                }
            } : undefined,
            attendanceRegisterStudent: {
                student: {
                    regno: {
                        contains: regno,
                        mode: "insensitive"
                    },
                    OR: [
                        {
                            surname: {
                                contains: name,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                contains: name,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                in: name.split(/\s+/),
                                mode: "insensitive"
                            }
                        },
                        {
                            surname: {
                                in: name.split(/\s+/),
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
                            code: true,
                            title: true
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
            surname,
            otherNames,
            name: `${surname} ${otherNames}`.toUpperCase(),
            crashCourseTitle: crashCourseAttendance ? crashCourseAttendance.course.title : null,
            crashCourseCode: crashCourseAttendance ? crashCourseAttendance.course.code : null
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
                    session: true,
                    courseId: true
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

    body.classAttendees = body.classAttendees || []

    const verifiedCourseIdsQuery = await prismaClient.course.findMany({
        where: {
            id: {
                in: body.classAttendees
                    .filter(({ crashCourseId }) => typeof crashCourseId == "string" && crashCourseId != classAttendancesCount.attendanceRegister.courseId)
                    .map(({ crashCourseId }) => (crashCourseId || String()).toString())
            }
        },
        select: {
            id: true
        }
    })

    const verifiedCourseIds = verifiedCourseIdsQuery.map(({ id }) => id)

    let classAttendeesWithStudentIdAndCrashCourseMap: Record<string, string> = {}

    const classAttendeeIds = body.classAttendees.map(({ studentId, crashCourseId }) => {
        if (crashCourseId && verifiedCourseIds.includes(crashCourseId)) {
            classAttendeesWithStudentIdAndCrashCourseMap[studentId] = crashCourseId
        }

        return studentId
    })

    // Get all the class attendees that exist in attendance register student record
    let existingClassAttendees = await prismaClient.attendanceRegisterStudent.findMany({
        where: {
            attendanceRegisterId: classAttendancesCount.attendanceRegisterId,
            studentId: {
                in: classAttendeeIds
            }
        },
        select: {
            id: true,
            studentId: true
        }
    })

    // Get all the class attendees that don't exist in attendance register student record
    let attendanceUnregisterStudentIds = classAttendeeIds
        .filter((classAttendeeId) => {
            return !existingClassAttendees
                .map(({ studentId }) => studentId)
                .includes(classAttendeeId)
        })
        .map((id) => ({
            studentId: id,
        }))

    // Add the class attendees that don't exist in attendance register student record
    const attendanceUnregisterStudentQuery = await prismaClient.attendanceRegister.update({
        where: {
            id: classAttendancesCount.attendanceRegisterId
        },
        select: {
            attendanceRegisterStudents: {
                where: {
                    studentId: {
                        in: attendanceUnregisterStudentIds.map(({ studentId }) => studentId)
                    }
                },
                select: {
                    studentId: true,
                    id: true
                }
            }
        },
        data: {
            attendanceRegisterStudents: {
                createMany: {
                    data: attendanceUnregisterStudentIds,
                    skipDuplicates: true
                }
            }
        }
    })

    let attendanceUnregisterStudent = attendanceUnregisterStudentQuery.attendanceRegisterStudents

    existingClassAttendees.push(...attendanceUnregisterStudent)

    // Create class attendees
    let { classAttendees, ...classAttendance } = await prismaClient.classAttendance.update({
        where: {
            id: classAttendancesCount.id
        },
        data: {
            classAttendees: {
                createMany: {
                    skipDuplicates: true,
                    data: existingClassAttendees.map(({ id }) => {
                        return ({
                            attendanceRegisterStudentId: id,
                        })
                    })
                }
            }
        },
        select: {
            endTime: true,
            date: true,
            status: true,
            startTime: true,
            submittedAt: true,
            createdAt: true,
            updatedAt: true,
            classAttendees: {
                select: {
                    attendanceRegisterStudent: {
                        select: {
                            studentId: true
                        }
                    },
                    id: true
                }
            },
        }
    })

    let classAttendeesWithStudentIdAndIdMap: Record<string, string> = {}

    classAttendees.forEach(({ id, attendanceRegisterStudent }) => [
        classAttendeesWithStudentIdAndIdMap[attendanceRegisterStudent.studentId] = id
    ])

    let classAttendeesWithCrashCourse = body.classAttendees
        .filter(({ crashCourseId }) => typeof crashCourseId == "string" && crashCourseId != classAttendancesCount.attendanceRegister.courseId)
        .map(({ studentId }) => studentId)

    let classAttendeeWithCrashCourseRecords = existingClassAttendees
        .filter(({ studentId }) => classAttendeesWithCrashCourse.includes(studentId))
        .filter(({ studentId }) => typeof classAttendeesWithStudentIdAndIdMap[studentId] == "string")
        .map(({ studentId }) => {
            return ({
                studentId,
                courseId: classAttendeesWithStudentIdAndCrashCourseMap[studentId],
                date: classAttendance.date,
                classAttendeeId: classAttendeesWithStudentIdAndIdMap[studentId],
                session: classAttendancesCount.attendanceRegister.session,
                startTime: classAttendance.startTime,
                endTime: classAttendance.endTime
            })
        })

    await prismaClient.crashCourseAttendance.createMany({
        skipDuplicates: true,
        data: classAttendeeWithCrashCourseRecords
    })

    res.status(200)
    res.json({
        ok: true,
        data: null,
        error: null
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

    let body: { classAttendeesId: string[] } = req.body || {}

    body.classAttendeesId = body.classAttendeesId || []

    await prismaClient.classAttendee.deleteMany({
        where: {
            id: {
                in: body.classAttendeesId
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

