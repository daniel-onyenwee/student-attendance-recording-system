import express from "express"
import { prismaClient } from "../../../utils/index.js"
import { $Enums } from "@prisma/client"

const SignedRoute = express.Router()

SignedRoute.get("/", async (req, res) => {
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

    let { attendanceRegister: { course, ...otherAttendanceRegisterData }, attendanceRegisterLecturer, date, startTime, endTime, ...otherData } = classAttendee.classAttendance
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

export default SignedRoute