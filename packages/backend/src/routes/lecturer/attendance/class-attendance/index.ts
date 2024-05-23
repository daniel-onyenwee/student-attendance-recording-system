import express from "express"
import { prismaClient } from "../../../../utils/index.js"
import SubmitRoute from "./submit.js"
import { $Enums } from "@prisma/client"

interface ClassAttendancePostRequestBody {
    attendanceRegisterId: string
    date: string
    startTime: string
    endTime: string
    latitude: number
    longitude: number
    classSize?: string
    classShape?: string
}

interface ClassAttendancePatchRequestBody {
    studentId: string
    status: "PRESENT" | "ABSENT"
    crashCourseId?: string
}

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
    crashCourse?: {
        code: ArrangeOrder
    }
} | (ClassAttendeeSurnameQueryOrderByObject | ClassAttendeeOtherNamesQueryOrderByObject)[]

type ArrangeBy = "classAttendeeName" | "classAttendeeRegno" | "classAttendeeCrashCourse"

type ArrangeOrder = "asc" | "desc"

const ClassAttendanceRoute = express.Router()

ClassAttendanceRoute.get("/", async (req, res) => {
    let lecturerId = req.app.get("user-id")

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
            crashCourse: {
                code: searchOrder
            }
        }
    }

    const classAttendance = await prismaClient.classAttendance.findFirst({
        where: {
            attendanceRegisterLecturer: {
                lecturerId: lecturerId
            },
            status: $Enums.ClassAttendanceStatus.ONGOING
        },
        select: {
            id: true,
            endTime: true,
            date: true,
            submittedAt: true,
            startTime: true,
            createdAt: true,
            status: true,
            updatedAt: true,
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
                message: "No class attendance started",
                code: 5000
            },
            data: null
        })
        return
    }

    let { classAttendees, attendanceRegister: { course, ...otherAttendanceRegisterData }, attendanceRegisterLecturer, date, startTime, endTime, ...otherData } = classAttendance
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

ClassAttendanceRoute.post("/", async (req, res) => {
    let lecturerId = req.app.get("user-id")
    let body: ClassAttendancePostRequestBody | null = req.body

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

    if (!body.attendanceRegisterId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'attendanceRegisterId'",
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
                code: 4018
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
                code: 4019
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
                code: 4020
            },
            data: null
        })
        return
    }

    if (!body.latitude) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'latitude'",
                code: 5002
            },
            data: null
        })
        return
    }

    if (!body.longitude) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'longitude'",
                code: 5003
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

    if (typeof body.latitude != "number") {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid latitude format",
                code: 5004
            },
            data: null
        })
        return
    }

    if (typeof body.longitude != "number") {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid longitude format",
                code: 5005
            },
            data: null
        })
        return
    }

    body.classSize = body.classSize || "SMALL"

    if (!["EXTRA_SMALL", "SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"].includes(body.classSize)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid classSize format",
                code: 5006
            },
            data: null
        })
        return
    }

    body.classShape = body.classShape || "SQUARE"

    if (!["CIRCLE", "SQUARE"].includes(body.classShape)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid classShape format",
                code: 5007
            },
            data: null
        })
        return
    }

    let classAttendancesCount = await prismaClient.classAttendance.count({
        where: {
            attendanceRegisterLecturer: {
                lecturerId: lecturerId
            },
            status: $Enums.ClassAttendanceStatus.ONGOING
        }
    })

    if (classAttendancesCount > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class attendance already started",
                code: 5001
            },
            data: null
        })
        return
    }

    // Check if the attendance register exist
    let attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            id: body.attendanceRegisterId,
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

    let attendanceRegisterLecturerWithLecturerId = await prismaClient.attendanceRegisterLecturer.findFirst({
        where: {
            attendanceRegisterId: body.attendanceRegisterId,
            lecturerId: lecturerId
        },
        select: {
            id: true
        }
    })

    if (!attendanceRegisterLecturerWithLecturerId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register lecturer not found",
                code: 4024
            },
            data: null
        })
        return
    }

    // Check if a class attendance with same property already
    const classAttendancesCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate = await prismaClient.classAttendance.count({
        where: {
            date: body.date,
            attendanceRegisterId: body.attendanceRegisterId,
            startTime: body.startTime,
            endTime: {
                lte: body.endTime
            }
        }
    })

    if (classAttendancesCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class attendance already exist",
                code: 4025
            },
            data: null
        })
        return
    }

    // Create the class attendance
    const classAttendance = await prismaClient.classAttendance.create({
        data: {
            attendanceRegisterId: body.attendanceRegisterId,
            status: $Enums.ClassAttendanceStatus.ONGOING,
            attendanceRegisterLecturerId: attendanceRegisterLecturerWithLecturerId.id,
            date: body.date,
            startTime: body.startTime,
            endTime: body.endTime,
            classLocation: {
                create: {
                    latitude: body.latitude,
                    longitude: body.longitude,
                    classShape: body.classShape as $Enums.ClassShape,
                    classSize: body.classSize as $Enums.ClassSize
                }
            }
        },
        select: {
            id: true,
            endTime: true,
            date: true,
            status: true,
            startTime: true,
            submittedAt: true,
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

ClassAttendanceRoute.patch("/", async (req, res) => {
    let lecturerId = req.app.get("user-id")
    let body: ClassAttendancePatchRequestBody | null = req.body

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
                message: "No class attendance started",
                code: 5000
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

        let { classAttendance, ...classAttendee } = await prismaClient.classAttendee.delete({
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

ClassAttendanceRoute.delete("/", async (req, res) => {
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

    const classAttendance = await prismaClient.classAttendance.delete({
        where: {
            id: classAttendancesCount.id,
        },
        select: {
            id: true,
            endTime: true,
            date: true,
            startTime: true,
            createdAt: true,
            status: true,
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

ClassAttendanceRoute.use("/submit", SubmitRoute

)

export default ClassAttendanceRoute