import express from "express"
import { getCurrentSession, prismaClient } from "../../../utils/index.js"
import { $Enums } from "@prisma/client"

type ArrangeBy = "title" | "code" | "session" | "semester" | "updatedAt" | "createdAt" | "department" | "faculty" | "level"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "department" | "faculty">> & {
    department?: Partial<{
        name: ArrangeOrder,
        faculty: {
            name: ArrangeOrder,
        }
    }>
}

const RegisterRoute = express.Router()

RegisterRoute.get("/", async (req, res) => {
    let lecturerId = req.app.get("user-id")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let code = url.searchParams.get("code") || String()
    let title = url.searchParams.get("title") || String()
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

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    if (session) {
        session = /^(\d{4})\/(\d{4})$/.test(session) ? session : getCurrentSession()
    }

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["title", "code", "session", "semester", "updatedAt", "createdAt", "department", "faculty", "level"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}
    if (searchBy == "department") {
        orderBy = {
            department: {
                name: searchOrder
            }
        }
    } else if (searchBy == "faculty") {
        orderBy = {
            department: {
                faculty: {
                    name: searchOrder
                }
            }
        }
    } else {
        orderBy[searchBy] = searchOrder
    }

    const attendanceRegistersQuery = await prismaClient.attendanceRegister.findMany({
        where: {
            attendanceRegisterLecturers: {
                some: {
                    lecturerId: lecturerId
                }
            },
            course: {
                title: {
                    contains: title,
                    mode: "insensitive"
                },
                code: {
                    contains: code,
                    mode: "insensitive"
                },
                semester: semester ? {
                    equals: semester as $Enums.Semester,
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
            },
            session: {
                contains: session,
                mode: "insensitive"
            }
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            id: true,
            decision: true,
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
            },
            createdAt: true,
            updatedAt: true,
        }
    })

    let attendanceRegisters = attendanceRegistersQuery.map(({ course: { department: { name: departmentName, faculty: { name: facultyName } }, ...otherCourseData }, ...otherData }) => {
        return ({
            department: departmentName,
            faculty: facultyName,
            ...otherCourseData,
            ...otherData
        })
    })

    res.status(200)
    res.json({
        ok: true,
        data: attendanceRegisters,
        error: null
    })
})

export default RegisterRoute