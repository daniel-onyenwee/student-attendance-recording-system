import express from "express"
import { idValidator } from "../../../../../middleware/index.js"
import { $Enums, Prisma, PrismaClient } from "@prisma/client"
import { mergeCourseCrashSQL } from "../../../../../services/index.js"

const AcceptRoute = express.Router()

AcceptRoute.post("/:classAttendanceId/accept", idValidator("classAttendanceId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let classAttendanceId = req.params.classAttendanceId

    let classAttendancesCount = await prismaClient.classAttendance.findUnique({
        where: {
            id: classAttendanceId
        },
        select: {
            id: true,
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

    if (classAttendancesCount.status == "COMPLETED") {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Class attendance already accepted",
                code: 4032
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
            status: $Enums.ClassAttendanceStatus.COMPLETED,
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
                            surname: true,
                            username: true,
                        }
                    }
                }
            }
        }
    })

    // Raw sql to handle merging of course crashes to their respective class attendances 
    await prismaClient.$executeRaw(Prisma.sql([mergeCourseCrashSQL]))

    let { attendanceRegister: { course, ...otherAttendanceRegisterData }, attendanceRegisterLecturer, date, startTime, endTime, ...otherData } = classAttendance
    let {
        surname,
        otherNames,
        username,
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
            lecturerUsername: username,
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

export default AcceptRoute