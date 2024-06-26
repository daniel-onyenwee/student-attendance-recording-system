import express from "express"
import { $Enums, PrismaClient } from "@prisma/client"

const LecturerRoute = express.Router()

LecturerRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let username = url.searchParams.get("username") || String()
    let password = url.searchParams.get("password") || String()
    let gender = url.searchParams.get("gender") || String()

    if (gender) {
        gender = ["MALE", "FEMALE"].includes(gender) ? gender : "MALE"
    }

    const lecturersCount = await prismaClient.lecturer.count({
        where: {
            password: {
                contains: password,
                mode: "insensitive"
            },
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
            },
            username: {
                contains: username,
                mode: "insensitive"
            },
            OR: [
                {
                    surname: {
                        contains: name,
                        mode: "insensitive"
                    }
                },
                {
                    otherNames: {
                        contains: name,
                        mode: "insensitive"
                    }
                },
                {
                    otherNames: {
                        in: name.split(/\s+/),
                        mode: "insensitive"
                    }
                },
                {
                    surname: {
                        in: name.split(/\s+/),
                        mode: "insensitive"
                    }
                }
            ],
            gender: gender ? {
                equals: gender as $Enums.Gender
            } : undefined
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            count: lecturersCount
        },
        error: null
    })
})

export default LecturerRoute