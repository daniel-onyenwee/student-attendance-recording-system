import express from "express"
import { PrismaClient } from "@prisma/client"

const FacultyRoute = express.Router()

FacultyRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let name = url.searchParams.get("name") || String()

    const facultiesCount = await prismaClient.faculty.count({
        where: {
            name: {
                contains: name,
                mode: "insensitive"
            },
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            count: facultiesCount
        },
        error: null
    })
})

export default FacultyRoute