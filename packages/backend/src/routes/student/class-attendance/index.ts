import express from "express"
import SignInRoute from "./signin.js"
import SignOutRoute from "./signout.js"
import { getCurrentSession, isStudentInsideClassroom } from "../../../utils/index.js"
import { $Enums, PrismaClient } from "@prisma/client"
import SignedRoute from "./signed.js"

type CourseArrangeBy = "courseTitle" | "courseCode" | "session" | "semester" | "department" | "faculty" | "level"

type ArrangeBy = "updatedAt" | "createdAt" | "lecturerName" | CourseArrangeBy

type ArrangeOrder = "asc" | "desc"

interface LecturerSurnameQueryOrderByObject {
    attendanceRegisterLecturer: {
        lecturer: {
            surname?: ArrangeOrder
        }
    }
}

interface LecturerOtherNamesQueryOrderByObject {
    attendanceRegisterLecturer: {
        lecturer: {
            otherNames?: ArrangeOrder
        }
    }
}

type QueryOrderByObject = (Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "lecturerName" | CourseArrangeBy>> & {
    attendanceRegister?: {
        session?: ArrangeOrder
        course?: {
            title?: ArrangeOrder
            code?: ArrangeOrder
            semester?: ArrangeOrder
            level?: ArrangeOrder
            department?: {
                name?: ArrangeOrder
                faculty?: {
                    name?: ArrangeOrder
                }
            }
        }
    }
}) | (LecturerSurnameQueryOrderByObject | LecturerOtherNamesQueryOrderByObject)[]

const ClassAttendanceRoute = express.Router()

ClassAttendanceRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)

    let currentTimestamp = url.searchParams.get("currentTimestamp") || null
    let latitude: number | string | null = url.searchParams.get("latitude") || null
    let longitude: number | string | null = url.searchParams.get("longitude") || null

    let department = url.searchParams.get("department") || String()
    let lecturerName = url.searchParams.get("lecturerName") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let courseCode = url.searchParams.get("courseCode") || String()
    let courseTitle = url.searchParams.get("courseTitle") || String()
    let level = url.searchParams.get("level") || String()
    let semester = url.searchParams.get("semester") || String()
    let session = url.searchParams.get("session") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    if (!currentTimestamp) {
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

    if (!latitude) {
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

    if (!longitude) {
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
    if (Number.isNaN(new Date(currentTimestamp).getDate())) {
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

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    if (session) {
        session = /^(\d{4})\/(\d{4})$/.test(session) ? session : getCurrentSession()
    }

    latitude = +latitude
    longitude = +longitude

    if (isNaN(latitude)) {
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

    if (isNaN(longitude)) {
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

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["updatedAt", "createdAt", "lecturerName", "courseTitle", "courseCode", "session", "semester", "department", "faculty", "level"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}

    if (searchBy == "lecturerName") {
        orderBy = [
            {
                attendanceRegisterLecturer: {
                    lecturer: {
                        surname: searchOrder
                    }
                }
            },
            {
                attendanceRegisterLecturer: {
                    lecturer: {
                        otherNames: searchOrder
                    }
                }
            }
        ]
    } else if (searchBy == "session") {
        orderBy = {
            attendanceRegister: {
                session: searchOrder
            }
        }
    } else if (searchBy == "courseCode") {
        orderBy = {
            attendanceRegister: {
                course: {
                    code: searchOrder
                }
            }
        }
    } else if (searchBy == "department") {
        orderBy = {
            attendanceRegister: {
                course: {
                    department: {
                        name: searchOrder
                    }
                }
            }
        }
    } else if (searchBy == "faculty") {
        orderBy = {
            attendanceRegister: {
                course: {
                    department: {
                        faculty: {
                            name: searchOrder
                        }
                    }
                }
            }
        }
    } else if (searchBy == "semester" || searchBy == "level") {
        orderBy = {
            attendanceRegister: {
                course: {
                    [searchBy]: searchOrder
                }
            }
        }
    } else if (searchBy == "courseTitle") {
        orderBy = {
            attendanceRegister: {
                course: {
                    title: searchOrder
                }
            }
        }
    } else {
        orderBy[searchBy] = searchOrder
    }

    const classAttendancesQuery = await prismaClient.classAttendance.findMany({
        where: {
            status: $Enums.ClassAttendanceStatus.ONGOING,
            date: currentTimestamp,
            startTime: {
                lte: currentTimestamp
            },
            endTime: {
                gte: currentTimestamp
            },
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
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
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

    const classAttendances = classAttendancesQuery
        .filter(({ classLocation }) => classLocation ? isStudentInsideClassroom({ latitude, longitude }, classLocation) : false)
        .map(({ attendanceRegister: { course, ...otherAttendanceRegisterData }, attendanceRegisterLecturer, date, startTime, endTime, classLocation, ...otherData }) => {
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
            return ({
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
            })
        })

    res.status(200)
    res.json({
        ok: true,
        error: null,
        data: classAttendances
    })
})

ClassAttendanceRoute.use("/signed", SignedRoute)

ClassAttendanceRoute.use("/signin", SignInRoute)

ClassAttendanceRoute.use("/signout", SignOutRoute)

export default ClassAttendanceRoute