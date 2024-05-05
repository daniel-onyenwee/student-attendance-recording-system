import express from "express"
import { getCurrentSession, prismaClient } from "../../../../../../utils/index.js"
import { $Enums } from "@prisma/client"
import { subMonths } from "date-fns"
import { idValidator } from "../../../../../../middleware/index.js"
import ClassAttendanceIDRoute from "./[classAttendanceId].js"

interface ClassAttendanceRequestBody {
    attendanceRegisterLecturerId: string
    date: string
    startTime: string
    endTime: string,
    classAttendees: {
        attendanceRegisterStudentId: string
        crashCourseId?: string
    }[]
}

type CourseArrangeBy = "courseTitle" | "courseCode" | "session" | "semester" | "department" | "faculty" | "level"

type ArrangeBy = "date" | "startTime" | "endTime" | "updatedAt" | "createdAt" | "lecturerName" | CourseArrangeBy

type ArrangeOrder = "asc" | "desc"

interface LecturerSurnameQueryOrderByObject {
    attendanceRegisterLecturer: {
        lecturer: {
            surname?: ArrangeOrder
        }
    }
}

interface LecturerOtherNamesQueryOrderByObject {
    attendanceRegisterLecturer: {
        lecturer: {
            otherNames?: ArrangeOrder
        }
    }
}

type QueryOrderByObject = (Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "lecturerName" | CourseArrangeBy>> & {
    attendanceRegister?: {
        session?: ArrangeOrder
        course?: {
            title?: ArrangeOrder
            code?: ArrangeOrder
            semester?: ArrangeOrder
            level?: ArrangeOrder
            department?: {
                name?: ArrangeOrder
                faculty?: {
                    name?: ArrangeOrder
                }
            }
        }
    }
}) | (LecturerSurnameQueryOrderByObject | LecturerOtherNamesQueryOrderByObject)[]


const ClassAttendanceRoute = express.Router()

ClassAttendanceRoute.get("/:registerId/class-attendance", idValidator("registerId"), async (req, res) => {
    let registerId = req.params.registerId

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let date = url.searchParams.get("date") || String()
    let startTime = url.searchParams.get("startTime") || String()
    let endTime = url.searchParams.get("endTime") || String()
    let department = url.searchParams.get("department") || String()
    let lecturerName = url.searchParams.get("lecturerName") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let courseCode = url.searchParams.get("courseCode") || String()
    let courseTitle = url.searchParams.get("courseTitle") || String()
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

    // Number.isNaN(new Date(date).getDate()) to check if 'date' is a valid date input
    if (date && Number.isNaN(new Date(date).getDate())) {
        date = new Date().toISOString()
    }

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["date", "startTime", "endTime", "updatedAt", "createdAt", "lecturerName", "courseTitle", "courseCode", "session", "semester", "department", "faculty", "level"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

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


    let orderBy: QueryOrderByObject = {}

    if (searchBy == "lecturerName") {
        orderBy = [
            {
                attendanceRegisterLecturer: {
                    lecturer: {
                        surname: searchOrder
                    }
                }
            },
            {
                attendanceRegisterLecturer: {
                    lecturer: {
                        otherNames: searchOrder
                    }
                }
            }
        ]
    } else if (searchBy == "session") {
        orderBy = {
            attendanceRegister: {
                session: searchOrder
            }
        }
    } else if (searchBy == "courseCode") {
        orderBy = {
            attendanceRegister: {
                course: {
                    code: searchOrder
                }
            }
        }
    } else if (searchBy == "department") {
        orderBy = {
            attendanceRegister: {
                course: {
                    department: {
                        name: searchOrder
                    }
                }
            }
        }
    } else if (searchBy == "faculty") {
        orderBy = {
            attendanceRegister: {
                course: {
                    department: {
                        faculty: {
                            name: searchOrder
                        }
                    }
                }
            }
        }
    } else if (searchBy == "semester" || searchBy == "level") {
        orderBy = {
            attendanceRegister: {
                course: {
                    [searchBy]: searchOrder
                }
            }
        }
    } else if (searchBy == "courseTitle") {
        orderBy = {
            attendanceRegister: {
                course: {
                    title: searchOrder
                }
            }
        }
    } else {
        orderBy[searchBy] = searchOrder
    }

    const ClassAttendancesQuery = await prismaClient.classAttendance.findMany({
        where: {
            date: date ? {
                equals: date
            } : undefined,
            startTime: startTime ? {
                equals: startTime
            } : undefined,
            endTime: endTime ? {
                equals: endTime
            } : undefined,
            attendanceRegisterId: registerId,
            attendanceRegister: {
                session: {
                    contains: session,
                    mode: "insensitive"
                },
                course: {
                    code: {
                        contains: courseCode,
                        mode: "insensitive"
                    },
                    title: {
                        contains: courseTitle,
                        mode: "insensitive"
                    },
                    semester: semester ? {
                        equals: semester as $Enums.Semester
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
                }
            },
            attendanceRegisterLecturer: {
                lecturer: {
                    OR: [
                        {
                            surname: {
                                contains: lecturerName,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                contains: lecturerName,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                in: lecturerName.split(/\s+/),
                                mode: "insensitive"
                            }
                        },
                        {
                            surname: {
                                in: lecturerName.split(/\s+/),
                                mode: "insensitive"
                            }
                        }
                    ]
                }
            }
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            id: true,
            endTime: true,
            date: true,
            startTime: true,
            createdAt: true,
            updatedAt: true,
            attendanceRegister: {
                select: {
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
                    }
                }
            },
            attendanceRegisterLecturer: {
                select: {
                    lecturer: {
                        select: {
                            otherNames: true,
                            surname: true
                        }
                    }
                }
            }
        }
    })

    let classAttendances = ClassAttendancesQuery.map(({ attendanceRegister: { course, ...otherAttendanceRegisterData }, attendanceRegisterLecturer, date, startTime, endTime, ...otherData }) => {
        let {
            surname,
            otherNames,
        } = attendanceRegisterLecturer.lecturer
        let {
            code: courseCode,
            title: courseTitle,
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            },
            ...otherCourseDate
        } = course
        return ({
            courseTitle,
            courseCode,
            ...otherCourseDate,
            ...otherAttendanceRegisterData,
            lecturerName: `${surname} ${otherNames}`.toUpperCase(),
            department: departmentName,
            faculty: facultyName,
            date,
            startTime,
            endTime,
            ...otherData
        })
    })

    res.status(200)
    res.json({
        ok: true,
        data: classAttendances,
        error: null
    })
})

ClassAttendanceRoute.post("/:registerId/class-attendance", idValidator("registerId"), async (req, res) => {
    let registerId = req.params.registerId

    let body: ClassAttendanceRequestBody | null = req.body

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

    if (!body.attendanceRegisterLecturerId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'attendanceRegisterLecturerId'",
                code: 4016
            },
            data: null
        })
        return
    }

    if (!body.date) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'date'",
                code: 4017
            },
            data: null
        })
        return
    }

    if (!body.startTime) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'startTime'",
                code: 4018
            },
            data: null
        })
        return
    }

    if (!body.endTime) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'endTime'",
                code: 4019
            },
            data: null
        })
        return
    }

    if (!body.classAttendees) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'classAttendees'",
                code: 4020
            },
            data: null
        })
        return
    }

    // Number.isNaN(new Date(body.date).getDate()) to check if body.date is a valid date input
    if (Number.isNaN(new Date(body.date).getDate())) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid date format",
                code: 4021
            },
            data: null
        })
        return
    }

    // Number.isNaN(new Date(body.startTime).getDate()) to check if body.startTime is a valid date input
    if (Number.isNaN(new Date(body.startTime).getDate())) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid startTime format",
                code: 4022
            },
            data: null
        })
        return
    }

    // Number.isNaN(new Date(body.endTime).getDate()) to check if body.endTime is a valid date input
    if (Number.isNaN(new Date(body.endTime).getDate())) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid endTime format",
                code: 4023
            },
            data: null
        })
        return
    }

    if (!Array.isArray(body.classAttendees)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid classAttendees format",
                code: 4024
            },
            data: null
        })
        return
    }

    let attendanceRegister = await prismaClient.attendanceRegister.findUnique({
        where: {
            id: registerId,
        },
        select: {
            session: true,
            courseId: true
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

    let attendanceRegisterLecturersCount = await prismaClient.attendanceRegisterLecturer.count({
        where: {
            id: body.attendanceRegisterLecturerId,
            attendanceRegisterId: registerId
        }
    })

    if (attendanceRegisterLecturersCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register lecturer not found",
                code: 4025
            },
            data: null
        })
        return
    }

    const classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate = await prismaClient.classAttendance.count({
        where: {
            date: body.date,
            attendanceRegisterLecturerId: body.attendanceRegisterLecturerId,
            attendanceRegisterId: registerId
        }
    })

    if (classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class attendance already exist",
                code: 4026
            },
            data: null
        })
        return
    }

    const deleteAMonthOldCrashCourseAttendanceQuery = prismaClient.crashCourseAttendance.deleteMany({
        where: {
            courseId: attendanceRegister.courseId,
            date: {
                lte: subMonths(body.date, 1)
            }
        }
    })

    const crashCourseAttendeeIdsQuery = prismaClient.crashCourseAttendance.findMany({
        where: {
            session: attendanceRegister.session,
            courseId: attendanceRegister.courseId,
            date: body.date,
            startTime: {
                gte: body.startTime
            },
            endTime: {
                lte: body.endTime
            }
        },
        select: {
            studentId: true
        }
    })

    const [_, crashCourseAttendeeIdsQueryResult] = await prismaClient.$transaction([
        deleteAMonthOldCrashCourseAttendanceQuery,
        crashCourseAttendeeIdsQuery
    ])

    const crashCourseAttendeeIds = crashCourseAttendeeIdsQueryResult
        .map(({ studentId }) => studentId)

    let classAttendeesWithCrashCourseMap: Record<string, string> = {}

    const classAttendeeIds = body.classAttendees.map(({ attendanceRegisterStudentId, crashCourseId }) => {
        if (crashCourseId) {
            classAttendeesWithCrashCourseMap[attendanceRegisterStudentId] = crashCourseId
        }

        return attendanceRegisterStudentId
    })

    let filterClassAttendees = await prismaClient.attendanceRegisterStudent.findMany({
        where: {
            attendanceRegisterId: registerId,
            OR: [
                {
                    studentId: {
                        in: crashCourseAttendeeIds
                    }
                },
                {
                    id: {
                        in: classAttendeeIds
                    }
                }
            ]
        },
        select: {
            id: true,
            studentId: true
        }
    })

    const classAttendanceQuery = prismaClient.classAttendance.create({
        data: {
            attendanceRegisterId: registerId,
            attendanceRegisterLecturerId: body.attendanceRegisterLecturerId,
            date: body.date,
            startTime: body.startTime,
            endTime: body.endTime,
            classAttendees: {
                createMany: {
                    skipDuplicates: true,
                    data: filterClassAttendees.map(({ id }) => {
                        let crashCourseId = classAttendeesWithCrashCourseMap[id]

                        return ({
                            attendanceRegisterStudentId: id,
                            crashCourseId: (crashCourseId != attendanceRegister.courseId ? crashCourseId : null) || null
                        })
                    })
                }
            }
        },
        select: {
            id: true,
            endTime: true,
            date: true,
            startTime: true,
            createdAt: true,
            updatedAt: true,
            attendanceRegister: {
                select: {
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
                    }
                }
            },
            attendanceRegisterLecturer: {
                select: {
                    lecturer: {
                        select: {
                            otherNames: true,
                            surname: true
                        }
                    }
                }
            }
        }
    })

    const deleteRecordedCrashCourseAttendeeQuery = prismaClient.crashCourseAttendance.deleteMany({
        where: {
            session: attendanceRegister.session,
            courseId: attendanceRegister.courseId,
            date: body.date,
            startTime: {
                gte: body.startTime
            },
            endTime: {
                lte: body.endTime
            },
            studentId: {
                in: crashCourseAttendeeIds
            }
        }
    })

    const [classAttendance] = await prismaClient.$transaction([
        classAttendanceQuery,
        deleteRecordedCrashCourseAttendeeQuery
    ])

    let classAttendeesWithCrashCourse = body.classAttendees
        .filter(({ crashCourseId }) => typeof crashCourseId == "string" && crashCourseId != attendanceRegister.courseId)
        .map(({ attendanceRegisterStudentId }) => attendanceRegisterStudentId)

    let classAttendeeWithCrashCourseRecords = filterClassAttendees
        .filter(({ id }) => classAttendeesWithCrashCourse.includes(id))
        .map(({ id, studentId }) => {
            return ({
                studentId,
                courseId: classAttendeesWithCrashCourseMap[id],
                date: body.date,
                session: attendanceRegister.session,
                startTime: body.startTime,
                endTime: body.endTime
            })
        })

    await prismaClient.crashCourseAttendance.createMany({
        data: classAttendeeWithCrashCourseRecords
    })

    let { attendanceRegister: { course, ...otherAttendanceRegisterData }, attendanceRegisterLecturer, date, startTime, endTime, ...otherData } = classAttendance
    let {
        surname,
        otherNames,
    } = attendanceRegisterLecturer.lecturer
    let {
        code: courseCode,
        title: courseTitle,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        },
        ...otherCourseDate
    } = course

    res.status(200)
    res.json({
        ok: true,
        data: {
            courseTitle,
            courseCode,
            ...otherCourseDate,
            ...otherAttendanceRegisterData,
            lecturerName: `${surname} ${otherNames}`.toUpperCase(),
            department: departmentName,
            faculty: facultyName,
            date,
            startTime,
            endTime,
            ...otherData
        },
        error: null
    })
})

ClassAttendanceRoute.use("/", ClassAttendanceIDRoute)

export default ClassAttendanceRoute