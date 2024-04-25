import express from "express"
import { prismaClient } from "../../../../utils/index.js"
import { idValidator } from "../../../../middleware/index.js"

interface FacultyIDRequestBody {
    name: string
}

const FacultyIDRoute = express.Router()

FacultyIDRoute.get("/:facultyId", idValidator("facultyId"), async (req, res) => {
    let facultyId = req.params.facultyId

    let faculty = await prismaClient.faculty.findUnique({
        where: {
            id: facultyId
        },
        select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true
        }
    })

    if (!faculty) {
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

    res.status(200)
    res.json({
        ok: true,
        data: faculty,
        error: null
    })
})

FacultyIDRoute.patch("/:facultyId", idValidator("facultyId"), async (req, res) => {
    let facultyId = req.params.facultyId
    let body: FacultyIDRequestBody = req.body || {}
    body.name = body.name || String()
    body.name = body.name
        .toUpperCase()
        .replace("FACULTY OF", String())
        .replace("FACULTY", String())
        .trim()

    const facultiesCount = await prismaClient.faculty.count({
        where: {
            id: facultyId
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

    let updateData: Partial<FacultyIDRequestBody> = {}

    if (body.name) {
        const facultiesCountByName = await prismaClient.faculty.count({
            where: {
                name: body.name,
                id: {
                    not: {
                        equals: facultyId
                    }
                }
            }
        })

        if (facultiesCountByName > 0) {
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

        updateData.name = body.name
    }

    const faculty = await prismaClient.faculty.update({
        where: {
            id: facultyId
        },
        data: updateData,
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

FacultyIDRoute.delete("/:facultyId", idValidator("facultyId"), async (req, res) => {
    let facultyId = req.params.facultyId

    let facultiesCount = await prismaClient.faculty.count({
        where: {
            id: facultyId
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

    const faculty = await prismaClient.faculty.delete({
        where: {
            id: facultyId
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

export default FacultyIDRoute