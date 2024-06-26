import express from "express"
import { PrismaClient } from "@prisma/client"

const DepartmentRoute = express.Router()

DepartmentRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let name = url.searchParams.get("name") || String()
    let faculty = url.searchParams.get("faculty") || String()

    const departmentsCount = await prismaClient.department.count({
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
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            count: departmentsCount
        },
        error: null
    })
})

export default DepartmentRoute