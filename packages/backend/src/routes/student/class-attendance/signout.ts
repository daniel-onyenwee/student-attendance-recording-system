import { $Enums, PrismaClient } from "@prisma/client"
import express from "express"

const SignOutRoute = express.Router()

SignOutRoute.post("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let userId = req.app.get("user-id")

    let classAttendee = await prismaClient.classAttendee.findFirst({
        where: {
            attendanceRegisterStudent: {
                studentId: userId
            },
            classAttendance: {
                status: $Enums.ClassAttendanceStatus.ONGOING
            }
        },
        select: {
            id: true
        }
    })

    if (!classAttendee) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Not signed to a class",
                code: 6009
            },
            data: null
        })
        return
    }

    const { classAttendance } = await prismaClient.classAttendee.delete({
        where: {
            id: classAttendee.id
        },
        select: {
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

export default SignOutRoute