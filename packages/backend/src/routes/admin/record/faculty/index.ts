import express from "express"
import { prismaClient } from "../../../../utils/index.js"
import FacultyIDRoute from "./[facultyId].js"

type ArrangeBy = "name" | "updatedAt" | "createdAt"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = Partial<Record<ArrangeBy, ArrangeOrder>>

interface FacultyRequestBody {
    name: string
}

const FacultyRoute = express.Router()

FacultyRoute.get("/", async (req, res) => {
    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let name = url.searchParams.get("name") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "updatedAt", "createdAt"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {}
    orderBy[searchBy] = searchOrder

    const faculties = await prismaClient.faculty.findMany({
        where: {
            name: {
                contains: name,
                mode: "insensitive"
            },
        },
        orderBy,
        skip: page * count,
        take: count,
        select: {
            name: true,
            id: true,
            createdAt: true,
            updatedAt: true
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: faculties,
        error: null
    })
})

FacultyRoute.post("/", async (req, res) => {
    let body: FacultyRequestBody | null = req.body

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
    body.name = body.name = body.name
        .toUpperCase()
        .replace("FACULTY OF", String())
        .replace("FACULTY", String())
        .trim()

    if (!body.name) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'name'",
                code: 3000
            },
            data: null
        })
        return
    }

    const facultiesCount = await prismaClient.faculty.count({
        where: {
            name: {
                equals: body.name,
                mode: "insensitive"
            }
        }
    })

    if (facultiesCount > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Faculty already exist",
                code: 3001
            },
            data: null
        })
        return
    }

    const faculty = await prismaClient.faculty.create({
        data: {
            name: body.name
        },
        select: {
            name: true,
            id: true,
            createdAt: true,
            updatedAt: true
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: faculty,
        error: null
    })
})

FacultyRoute.use("/", FacultyIDRoute)

export default FacultyRoute