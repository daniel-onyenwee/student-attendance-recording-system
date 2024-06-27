import { $Enums, PrismaClient } from "@prisma/client"
import express from "express"
import { idValidator } from "../../../../middleware/index.js"

interface DepartmentIDRequestBody {
    name: string,
    facultyId: string,
    levels: $Enums.Level[]
}

const DepartmentIDRoute = express.Router()

DepartmentIDRoute.get("/:departmentId", idValidator("departmentId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let departmentId = req.params.departmentId

    let department = await prismaClient.department.findUnique({
        where: {
            id: departmentId
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

    let { id, name, levels, faculty: { name: facultyName }, createdAt, updatedAt } = department

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name,
            levels,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

DepartmentIDRoute.patch("/:departmentId", idValidator("departmentId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let departmentId = req.params.departmentId

    let departmentCount = await prismaClient.department.count({
        where: {
            id: departmentId
        }
    })

    if (departmentCount <= 0) {
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

    let body: DepartmentIDRequestBody = req.body || {}
    body.name = body.name || String()
    body.name = body.name
        .toUpperCase()
        .replace("DEPARTMENT OF", String())
        .replace("DEPARTMENT", String())
        .trim()
    let updateData: Partial<DepartmentIDRequestBody> = {}

    if (body.name) {
        const departmentCountByName = await prismaClient.department.count({
            where: {
                name: body.name,
                id: {
                    not: {
                        equals: departmentId
                    }
                }
            }
        })

        if (departmentCountByName > 0) {
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

        updateData.name = body.name
    }

    if (body.facultyId) {
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

        updateData.facultyId = body.facultyId
    }

    if (body.levels) {
        body.levels = Array.from(new Set(body.levels || ["L_100"]))
        body.levels = body.levels.filter((level) => /L_(100|200|300|400|500|600|700|800|900|1000)/.test(level))
        body.levels = body.levels.length > 0 ? body.levels : ["L_100"]

        updateData.levels = body.levels
    }

    const department = await prismaClient.department.update({
        data: updateData,
        where: {
            id: departmentId
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

    let { id, name, levels, faculty: { name: facultyName }, createdAt, updatedAt } = department

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name,
            levels,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

DepartmentIDRoute.delete("/:departmentId", idValidator("departmentId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let departmentId = req.params.departmentId

    let departmentsCount = await prismaClient.department.count({
        where: {
            id: departmentId
        }
    })

    if (departmentsCount <= 0) {
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

    let department = await prismaClient.department.delete({
        where: {
            id: departmentId
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

    let { id, name, levels, faculty: { name: facultyName }, createdAt, updatedAt } = department

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name,
            levels,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

export default DepartmentIDRoute