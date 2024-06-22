import express from "express"
import { idValidator } from "../../../../../middleware/index.js"
import AcceptRoute from "./accept.js"
import { PrismaClient } from "@prisma/client"

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

interface ClassAttendanceIDRouteRequestBody {
    studentId: string
    status: "PRESENT" | "ABSENT"
    crashCourseId?: string
}

const ClassAttendanceIDRoute = express.Router()

ClassAttendanceIDRoute.get("/:classAttendanceId", idValidator("classAttendanceId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let classAttendanceId = req.params.classAttendanceId
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

    const classAttendance = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId,
        },
        select: {
            id: true,
            endTime: true,
            date: true,
            submittedAt: true,
            startTime: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            classAttendees: {
                skip: !getAllRecord ? page * count : undefined,
                take: !getAllRecord ? count : undefined,
                orderBy,
                where: {
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
            },
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

    if (!classAttendance) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class attendance not found",
                code: 4026
            },
            data: null
        })
        return
    }

    let {
        classAttendees,
        attendanceRegister: {
            course,
            ...otherAttendanceRegisterData
        },
        attendanceRegisterLecturer,
        date,
        startTime,
        endTime,
        ...otherData
    } = classAttendance
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

    let normalizeClassAttendees = classAttendees.map(({ id, crashCourseAttendance, attendanceRegisterStudent }) => {
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
            ...otherData,
            classAttendees: normalizeClassAttendees
        },
        error: null
    })
})

ClassAttendanceIDRoute.patch("/:classAttendanceId", idValidator("classAttendanceId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let classAttendanceId = req.params.classAttendanceId
    let body: ClassAttendanceIDRouteRequestBody | null = req.body || {}

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

    let classAttendancesCount = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId
        },
        select: {
            attendanceRegisterId: true,
            attendanceRegister: {
                select: {
                    session: true
                }
            },
            date: true,
            startTime: true,
            endTime: true,
            status: true
        }
    })

    if (!classAttendancesCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class attendance not found",
                code: 4026
            },
            data: null
        })
        return
    }

    if (classAttendancesCount.status == "ONGOING") {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class attendance is ongoing",
                code: 4027
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

        let { classAttendance, ...classAttendee } = await prismaClient.classAttendee.upsert({
            where: {
                classAttendanceId_attendanceRegisterStudentId: {
                    attendanceRegisterStudentId: newAttendanceRegisterStudent.id,
                    classAttendanceId: classAttendanceId
                }
            },
            update: {},
            create: {
                attendanceRegisterStudentId: newAttendanceRegisterStudent.id,
                classAttendanceId: classAttendanceId,
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
                classAttendance: {
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
            attendanceRegister: {
                course,
                ...otherAttendanceRegisterData
            },
            attendanceRegisterLecturer,
            date,
            startTime,
            endTime,
            ...otherData
        } = classAttendance
        let {
            surname: lecturerSurname,
            otherNames: lecturerOtherNames,
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
                courseTitle,
                courseCode,
                ...otherCourseDate,
                ...otherAttendanceRegisterData,
                lecturerName: `${lecturerSurname} ${lecturerOtherNames}`.toUpperCase(),
                department: departmentName,
                faculty: facultyName,
                date,
                startTime,
                endTime,
                ...otherData,
                classAttendee: {
                    id: presentClassAttendeeId,
                    status: "PRESENT",
                    regno,
                    name: `${studentSurname} ${studentOtherNames}`.toUpperCase(),
                    crashCourse: crashCourseAttendance ? crashCourseAttendance.course.code : null
                }
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
                classAttendanceId: classAttendanceId
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

        let { classAttendance, ...classAttendee } = await prismaClient.classAttendee.delete({
            where: {
                classAttendanceId_attendanceRegisterStudentId: {
                    attendanceRegisterStudentId: classAttendeeFirstEntry.attendanceRegisterStudentId,
                    classAttendanceId: classAttendanceId
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
                classAttendance: {
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
            attendanceRegister: {
                course,
                ...otherAttendanceRegisterData
            },
            attendanceRegisterLecturer,
            date,
            startTime,
            endTime,
            ...otherData
        } = classAttendance
        let {
            surname: lecturerSurname,
            otherNames: lecturerOtherNames,
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
                courseTitle,
                courseCode,
                ...otherCourseDate,
                ...otherAttendanceRegisterData,
                lecturerName: `${lecturerSurname} ${lecturerOtherNames}`.toUpperCase(),
                department: departmentName,
                faculty: facultyName,
                date,
                startTime,
                endTime,
                ...otherData,
                classAttendee: {
                    id: presentClassAttendeeId,
                    status: "ABSENT",
                    regno,
                    name: `${studentSurname} ${studentOtherNames}`.toUpperCase(),
                    crashCourse: crashCourseAttendance ? crashCourseAttendance.course.code : null
                }
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

ClassAttendanceIDRoute.delete("/:classAttendanceId", idValidator("classAttendanceId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let classAttendanceId = req.params.classAttendanceId

    let classAttendancesCount = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId,
        },
        select: {
            status: true
        }
    })

    if (!classAttendancesCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class attendance not found",
                code: 4026
            },
            data: null
        })
        return
    }

    if (classAttendancesCount.status == "ONGOING") {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class attendance is ongoing",
                code: 4027
            },
            data: null
        })
        return
    }

    const classAttendance = await prismaClient.classAttendance.delete({
        where: {
            id: classAttendanceId,
        },
        select: {
            id: true,
            endTime: true,
            date: true,
            status: true,
            startTime: true,
            createdAt: true,
            updatedAt: true,
            submittedAt: true,
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
            ...otherData,
            classAttendee: []
        },
        error: null
    })
})

ClassAttendanceIDRoute.use("/", AcceptRoute)

export default ClassAttendanceIDRoute