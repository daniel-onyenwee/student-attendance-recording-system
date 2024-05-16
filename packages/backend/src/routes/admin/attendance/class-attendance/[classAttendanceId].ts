import express from "express"
import { idValidator } from "../../../../middleware/index.js"
import { prismaClient } from "../../../../utils/index.js"

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

interface ClassAttendanceIDRouteRequestBody {
    studentId: string
    status: "PRESENT" | "ABSENT"
}

const ClassAttendanceIDRoute = express.Router()

ClassAttendanceIDRoute.get("/:classAttendanceId", idValidator("classAttendanceId"), async (req, res) => {
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
            crashCourse: {
                code: searchOrder
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
            startTime: true,
            createdAt: true,
            updatedAt: true,
            classAttendees: {
                skip: !getAllRecord ? page * count : undefined,
                take: !getAllRecord ? count : undefined,
                orderBy,
                where: {
                    crashCourse: {
                        code: classAttendeeCrashCourse ? {
                            contains: classAttendeeCrashCourse,
                            mode: "insensitive"
                        } : undefined
                    },
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
                    crashCourse: {
                        select: {
                            code: true
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

    let normalizeClassAttendees = classAttendees.map(({ id, crashCourse, attendanceRegisterStudent }) => {
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
            crashCourse: crashCourse ? crashCourse.code : null
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
                code: 4027
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
                code: 4028
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
                code: 4029
            },
            data: null
        })
        return
    }

    let classAttendanceCount = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId
        },
        select: {
            attendanceRegisterId: true
        }
    })

    if (!classAttendanceCount) {
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

    if (body.status == "PRESENT") {
        let newAttendanceRegisterStudent = await prismaClient.attendanceRegisterStudent.upsert({
            where: {
                attendanceRegisterId_studentId: {
                    attendanceRegisterId: classAttendanceCount.attendanceRegisterId,
                    studentId: body.studentId
                }
            },
            update: {},
            create: {
                attendanceRegisterId: classAttendanceCount.attendanceRegisterId,
                studentId: body.studentId
            },
            select: {
                id: true
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
                classAttendanceId: classAttendanceId
            },
            select: {
                id: true,
                crashCourse: {
                    select: {
                        code: true
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
            crashCourse,
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
                    regno,
                    name: `${studentSurname} ${studentOtherNames}`.toUpperCase(),
                    crashCourse: crashCourse ? crashCourse.code : null
                }
            },
            error: null
        })
        return
    } else if (body.status == "ABSENT") {
        let classAttendeesQuery = await prismaClient.classAttendee.findMany({
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

        let classAttendeesQueryFirstEntry = classAttendeesQuery[0]


        if (!classAttendeesQueryFirstEntry) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Class attendee not found",
                    code: 4030
                },
                data: null
            })
            return
        }

        let { classAttendance, ...classAttendee } = await prismaClient.classAttendee.delete({
            where: {
                classAttendanceId_attendanceRegisterStudentId: {
                    attendanceRegisterStudentId: classAttendeesQueryFirstEntry.attendanceRegisterStudentId,
                    classAttendanceId: classAttendanceId
                }
            },
            select: {
                id: true,
                crashCourse: {
                    select: {
                        code: true
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
            crashCourse,
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
                    regno,
                    name: `${studentSurname} ${studentOtherNames}`.toUpperCase(),
                    crashCourse: crashCourse ? crashCourse.code : null
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
            code: 4029
        },
        data: null
    })
})

ClassAttendanceIDRoute.delete("/:classAttendanceId", idValidator("classAttendanceId"), async (req, res) => {
    let classAttendanceId = req.params.classAttendanceId

    let classAttendanceCount = await prismaClient.classAttendance.count({
        where: {
            id: classAttendanceId,
        }
    })

    if (classAttendanceCount <= 0) {
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

    const classAttendance = await prismaClient.classAttendance.delete({
        where: {
            id: classAttendanceId,
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

export default ClassAttendanceIDRoute