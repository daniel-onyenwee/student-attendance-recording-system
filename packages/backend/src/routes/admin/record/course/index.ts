import express from "express"
import CourseIDRoute from "./[courseId].js"
import { prismaClient, removeSpecialChar } from "../../../../utils/index.js"
import { $Enums } from "@prisma/client"

type ArrangeBy = "title" | "code" | "semester" | "updatedAt" | "createdAt" | "department" | "faculty" | "level"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "department" | "faculty">> & {
    department?: Partial<{
        name: ArrangeOrder,
        faculty: {
            name: ArrangeOrder,
        }
    }>
}

interface CourseRequestBody {
    title: string
    code: string
    level: $Enums.Level
    semester: $Enums.Semester
    departmentId: string
}

const CourseRoute = express.Router()

CourseRoute.get("/", async (req, res) => {
    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let code = url.searchParams.get("code") || String()
    let title = url.searchParams.get("title") || String()
    let level = url.searchParams.get("level") || String()
    let semester = url.searchParams.get("semester") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["title", "code", "semester", "updatedAt", "createdAt", "department", "faculty", "level"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
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

    const coursesQuery = await prismaClient.course.findMany({
        where: {
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
        orderBy,
        skip: page * count,
        take: count,
        select: {
            id: true,
            title: true,
            code: true,
            semester: true,
            level: true,
            createdAt: true,
            updatedAt: true,
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
    })

    let courses = coursesQuery.map(({ department: { name: departmentName, faculty: { name: facultyName } }, ...otherData }) => {
        return ({
            ...otherData,
            department: departmentName,
            faculty: facultyName
        })
    })

    res.status(200)
    res.json({
        ok: true,
        data: courses,
        error: null
    })
})

CourseRoute.post("/", async (req, res) => {
    let body: CourseRequestBody | null = req.body

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

    body.title = (body.title || String()).toUpperCase()

    if (!body.title) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'title'",
                code: 3007
            },
            data: null
        })
        return
    }

    body.code = removeSpecialChar((body.code || String()).toUpperCase())

    if (!body.code) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'code'",
                code: 3008
            },
            data: null
        })
        return
    }

    if (!body.departmentId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'departmentId'",
                code: 3009
            },
            data: null
        })
        return
    }

    if (!/^([abcdefghijklmnopqrstwuxyz]){1,}(\d+)$/i.test(body.code)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid course code format",
                code: 3010
            },
            data: null
        })
        return
    }

    body.level = body.level || "L_100"
    if (!/L_(100|200|300|400|500|600|700|800|900|1000)/.test(body.level)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid level format",
                code: 3011
            },
            data: null
        })
        return
    }

    body.semester = body.semester || "FIRST"
    if (!/FIRST|SECOND/.test(body.semester)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid semester format",
                code: 3012
            },
            data: null
        })
        return
    }

    const department = await prismaClient.department.findUnique({
        where: {
            id: body.departmentId
        },
        select: {
            id: true,
            levels: true
        }
    })

    if (!department) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Department not found",
                code: 3006
            },
            data: null
        })
        return
    }

    const coursesCountByCode = await prismaClient.course.count({
        where: {
            code: body.code
        }
    })

    if (coursesCountByCode > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Course already exist",
                code: 3013
            },
            data: null
        })
        return
    }

    if (!department.levels.includes(body.level as $Enums.Level)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Level not supported",
                code: 3014
            },
            data: null
        })
        return
    }

    const course = await prismaClient.course.create({
        data: body,
        select: {
            id: true,
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
            },
            createdAt: true,
            updatedAt: true
        }
    })

    const { id, title, semester, code, level, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = course

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            code,
            title,
            level,
            semester,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

CourseRoute.use("/", CourseIDRoute)

export default CourseRoute