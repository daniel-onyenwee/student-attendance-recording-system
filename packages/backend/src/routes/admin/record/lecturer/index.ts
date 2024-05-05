import express from "express"
import LecturerIDRoute from "./[lecturerId].js"
import { $Enums } from "@prisma/client"
import { prismaClient } from "../../../../utils/index.js"
import { nanoid } from "nanoid"

interface LecturerRequestBody {
    surname: string
    otherNames: string
    gender: $Enums.Gender
    username: string
    password: string
    departmentId: string
}

type ArrangeBy = "name" | "gender" | "username" | "password" | "updatedAt" | "createdAt" | "department" | "faculty"

type ArrangeOrder = "asc" | "desc"

interface surnameQueryOrderByObject {
    surname?: ArrangeOrder
}

interface otherNamesQueryOrderByObject {
    otherNames?: ArrangeOrder
}

type QueryOrderByObject = Partial<Omit<Record<ArrangeBy, ArrangeOrder>, "department" | "name" | "faculty">> & {
    department?: Partial<{
        name: ArrangeOrder,
        faculty: {
            name: ArrangeOrder,
        }
    }>,
} | (surnameQueryOrderByObject | otherNamesQueryOrderByObject)[]

const LecturerRoute = express.Router()

LecturerRoute.get("/", async (req, res) => {
    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let username = url.searchParams.get("username") || String()
    let password = url.searchParams.get("password") || String()
    let gender = url.searchParams.get("gender") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    if (gender) {
        gender = ["MALE", "FEMALE"].includes(gender) ? gender : "MALE"
    }

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "gender", "username", "password", "updatedAt", "createdAt", "department", "faculty"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
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
    } else if (searchBy == "name") {
        orderBy = [
            {
                surname: searchOrder,
            },
            {
                otherNames: searchOrder
            }
        ]
    } else {
        orderBy[searchBy] = searchOrder
    }

    const lecturersQuery = await prismaClient.lecturer.findMany({
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
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            id: true,
            surname: true,
            otherNames: true,
            gender: true,
            username: true,
            password: true,
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

    let lecturers = lecturersQuery.map(({ department: { name: departmentName, faculty: { name: facultyName } }, surname, otherNames, ...otherData }) => {
        return ({
            name: `${surname} ${otherNames}`.toUpperCase(),
            ...otherData,
            department: departmentName,
            faculty: facultyName
        })
    })

    res.status(200)
    res.json({
        ok: true,
        data: lecturers,
        error: null
    })
})

LecturerRoute.post("/", async (req, res) => {
    let body: LecturerRequestBody | null = req.body

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

    body.surname = (body.surname || String()).toUpperCase()

    if (!body.surname) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'surname'",
                code: 3016
            },
            data: null
        })
        return
    }

    body.otherNames = (body.otherNames || String()).toUpperCase()

    if (!body.otherNames) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'otherNames'",
                code: 3017
            },
            data: null
        })
        return
    }

    if (!body.username) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'username'",
                code: 3018
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

    body.gender = body.gender || "MALE"
    if (!["MALE", "FEMALE"].includes(body.gender)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid gender format",
                code: 3019
            },
            data: null
        })
        return
    }

    body.password = body.password || "password"

    const departmentsCount = await prismaClient.department.count({
        where: {
            id: body.departmentId
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

    const lecturersCountByUsername = await prismaClient.lecturer.count({
        where: {
            username: body.username
        }
    })

    if (lecturersCountByUsername > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Username already exist",
                code: 2006
            },
            data: null
        })
        return
    }

    let generatedRefreshToken = nanoid(64)

    const user = await prismaClient.user.create({
        data: {
            refreshToken: generatedRefreshToken,
            type: "LECTURER",
            lecturers: {
                create: body
            }
        },
        select: {
            id: true,
            lecturers: {
                select: {
                    surname: true,
                    gender: true,
                    otherNames: true,
                    username: true,
                    password: true,
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
            }
        }
    })

    const { id, lecturers: [lecturerData] } = user
    const { surname, otherNames, password, username, gender, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = lecturerData

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            password,
            username,
            gender,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

LecturerRoute.use("/", LecturerIDRoute)

export default LecturerRoute