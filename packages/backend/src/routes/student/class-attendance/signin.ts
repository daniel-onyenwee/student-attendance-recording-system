import express from "express"
import { isStudentInsideClassroom, prismaClient } from "../../../utils/index.js"
import { $Enums } from "@prisma/client"

interface StudentRequestBody {
    classAttendanceId: string
    currentTimestamp: string
    latitude: number
    longitude: number
    crashCourseId?: string
}

const SignInRoute = express.Router()

SignInRoute.post("/", async (req, res) => {
    let userId = req.app.get("user-id")
    let body: StudentRequestBody | null = req.body

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

    if (!body.classAttendanceId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'classAttendanceId'",
                code: 6006
            },
            data: null
        })
        return
    }

    if (!body.currentTimestamp) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'currentTimestamp'",
                code: 6002
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
                code: 6003
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
                code: 6004
            },
            data: null
        })
        return
    }

    // Number.isNaN(new Date(currentTimestamp).getDate()) to check if currentTimestamp is a valid date input
    if (Number.isNaN(new Date(body.currentTimestamp).getDate())) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid currentTimestamp format",
                code: 6005
            },
            data: null
        })
        return
    }

    body.latitude = +body.latitude
    body.longitude = +body.longitude

    if (isNaN(body.latitude)) {
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

    if (isNaN(body.longitude)) {
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

    let classAttendeesCountByClassAttendanceStatusAndAttendanceRegisterStudentStudentId = await prismaClient.classAttendee.count({
        where: {
            attendanceRegisterStudent: {
                studentId: userId
            },
            classAttendance: {
                status: $Enums.ClassAttendanceStatus.ONGOING
            }
        }
    })

    if (classAttendeesCountByClassAttendanceStatusAndAttendanceRegisterStudentStudentId > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Already signed to a class",
                code: 6007
            },
            data: null
        })
        return
    }

    const classAttendance = await prismaClient.classAttendance.findUnique({
        where: {
            id: body.classAttendanceId,
            status: $Enums.ClassAttendanceStatus.ONGOING,
            date: body.currentTimestamp,
            startTime: {
                lte: body.currentTimestamp
            },
            endTime: {
                gte: body.currentTimestamp
            }
        },
        select: {
            id: true,
            endTime: true,
            date: true,
            startTime: true,
            createdAt: true,
            updatedAt: true,
            classLocation: {
                select: {
                    classShape: true,
                    classSize: true,
                    latitude: true,
                    longitude: true
                }
            },
            attendanceRegister: {
                select: {
                    session: true,
                    id: true,
                    course: {
                        select: {
                            title: true,
                            code: true,
                            level: true,
                            semester: true,
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

    if (!classAttendance.classLocation) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Present outside the class",
                code: 6008
            },
            data: null
        })
        return
    }

    if (!isStudentInsideClassroom({ latitude: body.latitude, longitude: body.longitude }, classAttendance.classLocation)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Present outside the class",
                code: 6008
            },
            data: null
        })
        return
    }

    let newAttendanceRegisterStudent = await prismaClient.attendanceRegisterStudent.upsert({
        where: {
            attendanceRegisterId_studentId: {
                attendanceRegisterId: classAttendance.attendanceRegister.id,
                studentId: userId
            }
        },
        update: {},
        create: {
            attendanceRegisterId: classAttendance.attendanceRegister.id,
            studentId: userId
        },
        select: {
            id: true,
            studentId: true
        }
    })

    await prismaClient.classAttendee.upsert({
        where: {
            classAttendanceId_attendanceRegisterStudentId: {
                attendanceRegisterStudentId: newAttendanceRegisterStudent.id,
                classAttendanceId: classAttendance.id
            }
        },
        update: {},
        create: {
            attendanceRegisterStudentId: newAttendanceRegisterStudent.id,
            classAttendanceId: classAttendance.id,
            crashCourseAttendance: body.crashCourseId ? {
                create: {
                    courseId: body.crashCourseId,
                    session: classAttendance.attendanceRegister.session,
                    date: classAttendance.date,
                    startTime: classAttendance.startTime,
                    endTime: classAttendance.endTime,
                    studentId: newAttendanceRegisterStudent.studentId
                }
            } : undefined
        }
    })

    let { attendanceRegister: { id: _attendanceRegisterId, course, ...otherAttendanceRegisterData }, attendanceRegisterLecturer, date, startTime, endTime, classLocation, ...otherData } = classAttendance
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

export default SignInRoute