import express from "express"
import { idValidator } from "../../../../../middleware/index.js"
import AcceptRoute from "./accept.js"
import { PrismaClient } from "@prisma/client"
import ClassAttendeeRoute from "./class-attendee.js"
import { differenceInHours } from "date-fns"

interface ClassAttendanceIDRequestBody {
    attendanceRegisterId: string
    attendanceRegisterLecturerId: string
    date: string
    startTime: string
    endTime: string
}

const ClassAttendanceIDRoute = express.Router()

ClassAttendanceIDRoute.get("/:classAttendanceId", idValidator("classAttendanceId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let classAttendanceId = req.params.classAttendanceId

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

ClassAttendanceIDRoute.patch("/:classAttendanceId", idValidator("classAttendanceId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let classAttendanceId = req.params.classAttendanceId

    let classAttendancesCount = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId,
        },
        select: {
            status: true,
            date: true,
            startTime: true,
            endTime: true,
            attendanceRegisterId: true
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

    let body: ClassAttendanceIDRequestBody = req.body || {}
    let updateData: Partial<ClassAttendanceIDRequestBody> = {}


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

    if (body.attendanceRegisterLecturerId) {
        // Check if the attendance register lecturer exist
        let attendanceRegisterLecturersCount = await prismaClient.attendanceRegisterLecturer.count({
            where: {
                id: body.attendanceRegisterLecturerId,
                attendanceRegisterId: body.attendanceRegisterId
            }
        })

        if (attendanceRegisterLecturersCount <= 0) {
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

        updateData.attendanceRegisterLecturerId = body.attendanceRegisterLecturerId
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
                    not: classAttendanceId
                },
                date: body.date || classAttendancesCount.date,
                attendanceRegisterId: classAttendancesCount.attendanceRegisterId,
                startTime: {
                    gte: body.startTime || classAttendancesCount.startTime
                },
                endTime: {
                    lte: body.endTime || classAttendancesCount.endTime
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

    // Update the class attendance
    const classAttendance = await prismaClient.classAttendance.update({
        where: {
            id: classAttendanceId
        },
        data: {
            attendanceRegisterId: updateData.attendanceRegisterId,
            attendanceRegisterLecturerId: updateData.attendanceRegisterLecturerId,
            date: updateData.date,
            startTime: updateData.startTime,
            endTime: updateData.endTime,
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
            ...otherData
        },
        error: null
    })
})

ClassAttendanceIDRoute.use("/", AcceptRoute)

ClassAttendanceIDRoute.use("/", ClassAttendeeRoute)

export default ClassAttendanceIDRoute