import express from "express"
import StudentIDRoute from "./[studentId].js"
import { $Enums, PrismaClient } from "@prisma/client"
import { nanoid } from "nanoid"

interface StudentRequestBody {
    surname: string
    otherNames: string
    gender: $Enums.Gender
    regno: string
    password: string
    departmentId: string
    level: $Enums.Level
}

type ArrangeBy = "name" | "gender" | "regno" | "level" | "password" | "updatedAt" | "createdAt" | "department" | "faculty"

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

const StudentRoute = express.Router()

StudentRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()
    let password = url.searchParams.get("password") || String()
    let gender = url.searchParams.get("gender") || String()
    let level = url.searchParams.get("level") || String()

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

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    let searchBy: ArrangeBy = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "gender", "regno", "level", "password", "updatedAt", "createdAt", "department", "faculty"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
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

    const studentsQuery = await prismaClient.student.findMany({
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
            regno: {
                contains: regno,
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
            level: level ? {
                equals: level as $Enums.Level
            } : undefined,
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
            level: true,
            regno: true,
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

    let students = studentsQuery.map(({ department: { name: departmentName, faculty: { name: facultyName } }, surname, otherNames, ...otherData }) => {
        let faceImage = new URL(`/image/student-face/${otherData.id}`, `http://${req.headers.host}`)
        return ({
            name: `${surname} ${otherNames}`.toUpperCase(),
            ...otherData,
            surname,
            otherNames,
            faceImage,
            department: departmentName,
            faculty: facultyName
        })
    })

    res.status(200)
    res.json({
        ok: true,
        data: students,
        error: null
    })
})

StudentRoute.post("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let body: StudentRequestBody | null = req.body

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

    if (!body.regno) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'regno'",
                code: 3021
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

    body.password = body.password || "password"

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

    const studentsCountByRegno = await prismaClient.student.count({
        where: {
            regno: body.regno
        }
    })

    if (studentsCountByRegno > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Regno already exist",
                code: 3022
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

    let generatedRefreshToken = nanoid(64)

    const user = await prismaClient.user.create({
        data: {
            refreshToken: generatedRefreshToken,
            type: "STUDENT",
            students: {
                create: body
            }
        },
        select: {
            id: true,
            students: {
                select: {
                    surname: true,
                    gender: true,
                    otherNames: true,
                    level: true,
                    regno: true,
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

    const { id, students: [studentData] } = user
    const {
        surname,
        otherNames,
        password,
        regno,
        level,
        gender,
        createdAt,
        updatedAt,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = studentData

    let faceImage = new URL(`/image/student-face/${id}`, `http://${req.headers.host}`)

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            password,
            surname,
            otherNames,
            regno,
            level,
            faceImage,
            gender,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

StudentRoute.delete("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let body: { studentsId: string[] } = req.body || {}

    body.studentsId = body.studentsId || []

    await prismaClient.user.deleteMany({
        where: {
            id: {
                in: body.studentsId
            },
            type: $Enums.UserType.STUDENT
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: null,
        error: null
    })
})

StudentRoute.use("/", StudentIDRoute)

export default StudentRoute