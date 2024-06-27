import { $Enums, PrismaClient } from "@prisma/client"
import express from "express"
import { getCurrentSession } from "../../../../utils/index.js"
import { idValidator } from "../../../../middleware/index.js"

const ClassAttendanceRoute = express.Router()

ClassAttendanceRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let date = url.searchParams.get("date") || String()
    let startTime = url.searchParams.get("startTime") || String()
    let endTime = url.searchParams.get("endTime") || String()
    let department = url.searchParams.get("department") || String()
    let lecturerName = url.searchParams.get("lecturerName") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let courseCode = url.searchParams.get("courseCode") || String()
    let courseTitle = url.searchParams.get("courseTitle") || String()
    let level = url.searchParams.get("level") || String()
    let semester = url.searchParams.get("semester") || String()
    let status = url.searchParams.get("status") || String()
    let session = url.searchParams.get("session") || String()

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    if (session) {
        session = /^(\d{4})\/(\d{4})$/.test(session) ? session : getCurrentSession()
    }

    if (status) {
        status = ["ONGOING", "REVIEWING", "COMPLETED"].includes(status) ? status : "REVIEWING"
    }

    // Number.isNaN(new Date(date).getDate()) to check if 'date' is a valid date input
    if (date && Number.isNaN(new Date(date).getDate())) {
        date = new Date().toISOString()
    }

    const ClassAttendancesCount = await prismaClient.classAttendance.count({
        where: {
            date: date ? {
                equals: date
            } : undefined,
            startTime: startTime ? {
                equals: startTime
            } : undefined,
            endTime: endTime ? {
                equals: endTime
            } : undefined,
            status: status ? {
                equals: status as $Enums.ClassAttendanceStatus
            } : undefined,
            attendanceRegister: {
                session: {
                    contains: session,
                    mode: "insensitive"
                },
                course: {
                    code: {
                        contains: courseCode,
                        mode: "insensitive"
                    },
                    title: {
                        contains: courseTitle,
                        mode: "insensitive"
                    },
                    semester: semester ? {
                        equals: semester as $Enums.Semester
                    } : undefined,
                    level: level ? {
                        equals: level as $Enums.Level
                    } : undefined,
                    department: {
                        name: {
                            contains: department,
                            mode: "insensitive"
                        },
                        faculty: {
                            name: {
                                contains: faculty,
                                mode: "insensitive"
                            }
                        }
                    }
                }
            },
            attendanceRegisterLecturer: {
                lecturer: {
                    OR: [
                        {
                            surname: {
                                contains: lecturerName,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                contains: lecturerName,
                                mode: "insensitive"
                            }
                        },
                        {
                            otherNames: {
                                in: lecturerName.split(/\s+/),
                                mode: "insensitive"
                            }
                        },
                        {
                            surname: {
                                in: lecturerName.split(/\s+/),
                                mode: "insensitive"
                            }
                        }
                    ]
                }
            }
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            count: ClassAttendancesCount
        },
        error: null
    })
})

ClassAttendanceRoute.get("/:classAttendanceId/class-attendee", idValidator("classAttendanceId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let classAttendanceId = req.params.classAttendanceId

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let classAttendeeName = url.searchParams.get("classAttendeeName") || String()
    let classAttendeeRegno = url.searchParams.get("classAttendeeRegno") || String()
    let classAttendeeCrashCourse = url.searchParams.get("classAttendeeCrashCourse") || String()

    const classAttendeesCount = await prismaClient.classAttendee.count({
        where: {
            classAttendanceId: classAttendanceId,
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
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            count: classAttendeesCount
        },
        error: null
    })
})

export default ClassAttendanceRoute