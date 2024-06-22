import express from "express"
import DepartmentIDRoute from "./[departmentId].js"
import { $Enums, PrismaClient } from "@prisma/client"

type ArrangeBy = "name" | "updatedAt" | "createdAt" | "faculty"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "faculty">> & {
    faculty?: Partial<{
        name: ArrangeOrder
    }>
}

interface DepartmentRequestBody {
    name: string,
    facultyId: string,
    levels: $Enums.Level[]
}

const DepartmentRoute = express.Router()

DepartmentRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let name = url.searchParams.get("name") || String()
    let faculty = url.searchParams.get("faculty") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "updatedAt", "createdAt", "faculty"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}
    if (searchBy == "faculty") {
        orderBy[searchBy] = {
            name: searchOrder
        }
    } else {
        orderBy[searchBy] = searchOrder
    }

    const departmentsQuery = await prismaClient.department.findMany({
        where: {
            name: {
                contains: name,
                mode: "insensitive"
            },
            faculty: {
                name: {
                    contains: faculty,
                    mode: "insensitive"
                }
            }
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            name: true,
            id: true,
            levels: true,
            createdAt: true,
            updatedAt: true,
            faculty: {
                select: {
                    name: true
                }
            }
        }
    })

    let departments = departmentsQuery.map(function ({ faculty: { name: faultyName }, ...otherData }) {
        return ({
            ...otherData,
            faculty: faultyName
        })
    })

    res.status(200)
    res.json({
        ok: true,
        data: departments,
        error: null
    })
})

DepartmentRoute.post("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let body: DepartmentRequestBody | null = req.body

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

    body.name = body.name || String()
    body.name = body.name
        .toUpperCase()
        .replace("DEPARTMENT OF", String())
        .replace("DEPARTMENT", String())
        .trim()

    if (!body.name) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'name'",
                code: 3003
            },
            data: null
        })
        return
    }

    if (!body.facultyId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'facultyId'",
                code: 3004
            },
            data: null
        })
        return
    }

    const facultiesCount = await prismaClient.faculty.count({
        where: {
            id: body.facultyId
        }
    })

    if (facultiesCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Faculty not found",
                code: 3002
            },
            data: null
        })
        return
    }

    const departmentsCountByName = await prismaClient.department.count({
        where: {
            name: {
                equals: body.name,
                mode: "insensitive"
            }
        }
    })

    if (departmentsCountByName > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Department already exist",
                code: 3005
            },
            data: null
        })
        return
    }

    body.levels = Array.from(new Set(body.levels || ["L_100"]))
    body.levels = body.levels.filter((level) => /L_(100|200|300|400|500|600|700|800|900|1000)/.test(level))
    body.levels = body.levels.length > 0 ? body.levels : ["L_100"]

    const department = await prismaClient.department.create({
        data: {
            name: body.name,
            levels: body.levels,
            faculty: {
                connect: {
                    id: body.facultyId
                }
            }
        },
        select: {
            name: true,
            id: true,
            levels: true,
            createdAt: true,
            updatedAt: true,
            faculty: {
                select: {
                    name: true
                }
            }
        }
    })

    const { id, name, levels, faculty: { name: facultyName }, updatedAt, createdAt } = department
    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name,
            levels,
            faculty: facultyName,
            updatedAt,
            createdAt
        },
        error: null
    })
})

DepartmentRoute.use("/", DepartmentIDRoute)

export default DepartmentRoute