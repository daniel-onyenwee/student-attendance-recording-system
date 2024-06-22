import express from "express"
import { $Enums, PrismaClient } from "@prisma/client"

interface SubmitRequestBody {
    endTime?: string
    submittedAt?: string
}

const SubmitRoute = express.Router()

SubmitRoute.post("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.app.get("user-id")
    let body: SubmitRequestBody = req.body || {}

    body.submittedAt = body.submittedAt || new Date().toISOString()

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

    // Number.isNaN(new Date(body.submittedAt).getDate()) to check if body.date is a valid date input
    if (Number.isNaN(new Date(body.submittedAt).getDate())) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid submittedAt format",
                code: 5008
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

    const classAttendance = await prismaClient.classAttendance.update({
        where: {
            id: classAttendancesCount.id,
        },
        data: {
            status: $Enums.ClassAttendanceStatus.REVIEWING,
            endTime: body.endTime ? body.endTime : undefined,
            submittedAt: body.submittedAt
        },
        select: {
            id: true,
            endTime: true,
            date: true,
            startTime: true,
            createdAt: true,
            updatedAt: true,
            submittedAt: true,
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

export default SubmitRoute