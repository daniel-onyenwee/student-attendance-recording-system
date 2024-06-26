import express from "express"
import SubmitRoute from "./submit.js"
import { $Enums, PrismaClient } from "@prisma/client"
import ClassAttendeeRoute from "./class-attendee.js"
import { differenceInHours } from "date-fns"

interface ClassAttendanceRequestBody {
    attendanceRegisterId: string
    date: string
    startTime: string
    endTime: string
    latitude: number
    longitude: number
    classSize?: string
    classShape?: string
}

const ClassAttendanceRoute = express.Router()

ClassAttendanceRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.app.get("user-id")

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
        },
        error: null
    })
})

ClassAttendanceRoute.post("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.app.get("user-id")
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

    if (differenceInHours(body.endTime, body.startTime) > 2) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class exceeds two hour",
                code: 4033
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
            id: body.attendanceRegisterId
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
            startTime: {
                gte: body.startTime
            },
            endTime: {
                lt: body.endTime
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
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.app.get("user-id")

    let body: ClassAttendanceRequestBody = req.body || {}
    let updateData: Partial<ClassAttendanceRequestBody> = {}

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

    if (body.attendanceRegisterId) {
        // Check if the attendance register exist
        let attendanceRegister = await prismaClient.attendanceRegister.count({
            where: {
                id: body.attendanceRegisterId,
            }
        })

        if (attendanceRegister <= 0) {
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


        updateData.attendanceRegisterId = body.attendanceRegisterId
    }

    if (body.date) {
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
    }

    if (body.startTime) {
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
    }

    if (body.endTime) {
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
    }

    if (body.date || body.endTime || body.startTime) {
        if (differenceInHours(body.endTime || classAttendancesCount.endTime, body.startTime || classAttendancesCount.startTime) > 2) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Class exceeds two hour",
                    code: 4033
                },
                data: null
            })
            return
        }

        // Check if a class attendance with same property already exist
        const classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate = await prismaClient.classAttendance.count({
            where: {
                id: {
                    not: classAttendancesCount.id
                },
                date: body.date || classAttendancesCount.date,
                attendanceRegisterId: classAttendancesCount.attendanceRegisterId,
                startTime: {
                    gte: body.startTime || classAttendancesCount.startTime
                },
                endTime: {
                    lt: body.endTime || classAttendancesCount.endTime
                }
            }
        })

        if (classAttendanceCountByAttendanceRegisterIdAttendanceRegisterLecturerIdDate > 0) {
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

        body.date ? updateData.date = body.date : void 0
        body.startTime ? updateData.startTime = body.startTime : void 0
        body.endTime ? updateData.endTime = body.endTime : void 0
    }

    if (body.classSize) {
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
    }

    if (body.classShape) {
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
    }

    // Update the class attendance
    const classAttendance = await prismaClient.classAttendance.update({
        where: {
            id: classAttendancesCount.id
        },
        data: {
            attendanceRegisterId: updateData.attendanceRegisterId,
            date: updateData.date,
            startTime: updateData.startTime,
            endTime: updateData.endTime,
            classLocation: {
                update: {
                    latitude: updateData.latitude,
                    longitude: updateData.longitude,
                    classShape: updateData.classShape as $Enums.ClassShape,
                    classSize: updateData.classShape as $Enums.ClassSize
                }
            }
        },
        select: {
            id: true,
            endTime: true,
            date: true,
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

ClassAttendanceRoute.delete("/", async (req, res) => {
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
            ...otherData
        },
        error: null
    })
})

ClassAttendanceRoute.use("/class-attendee", ClassAttendeeRoute)

ClassAttendanceRoute.use("/submit", SubmitRoute)

export default ClassAttendanceRoute