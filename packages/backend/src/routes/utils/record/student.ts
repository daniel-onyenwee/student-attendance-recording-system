import express from "express"
import { $Enums } from "@prisma/client"
import { prismaClient } from "../../../utils/index.js"

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

    let student = studentsQuery.map(({ department: { name: departmentName, faculty: { name: facultyName } }, surname, otherNames, ...otherData }) => {
        let faceImage = new URL(`/image/student-face/${otherData.id}`, `http://${req.headers.host}`)
        return ({
            name: `${surname} ${otherNames}`.toUpperCase(),
            ...otherData,
            faceImage,
            department: departmentName,
            faculty: facultyName
        })
    })

    res.status(200)
    res.json({
        ok: true,
        data: student,
        error: null
    })
})

export default StudentRoute