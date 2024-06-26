import express from "express"
import { $Enums, PrismaClient } from "@prisma/client"
import { getCurrentSession } from "../../../../utils/index.js"
import { idValidator } from "../../../../middleware/index.js"

const RegisterRoute = express.Router()

RegisterRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let code = url.searchParams.get("code") || String()
    let title = url.searchParams.get("title") || String()
    let level = url.searchParams.get("level") || String()
    let semester = url.searchParams.get("semester") || String()
    let session = url.searchParams.get("session") || String()

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    if (session) {
        session = /^(\d{4})\/(\d{4})$/.test(session) ? session : getCurrentSession()
    }

    const attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            course: {
                title: {
                    contains: title,
                    mode: "insensitive"
                },
                code: {
                    contains: code,
                    mode: "insensitive"
                },
                semester: semester ? {
                    equals: semester as $Enums.Semester,
                } : undefined,
                level: level ? {
                    equals: level as $Enums.Level
                } : undefined,
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
                }
            },
            session: {
                contains: session,
                mode: "insensitive"
            }
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            count: attendanceRegistersCount
        },
        error: null
    })
})

RegisterRoute.get("/:registerId/lecturer", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let gender = url.searchParams.get("gender") || String()

    if (gender) {
        gender = ["MALE", "FEMALE"].includes(gender) ? gender : "MALE"
    }

    const attendanceRegisterLecturersCount = await prismaClient.attendanceRegisterLecturer.count({
        where: {
            attendanceRegisterId: registerId,
            lecturer: {
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
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            count: attendanceRegisterLecturersCount
        },
        error: null
    })
})

RegisterRoute.get("/:registerId/student", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()
    let gender = url.searchParams.get("gender") || String()
    let level = url.searchParams.get("level") || String()

    if (gender) {
        gender = ["MALE", "FEMALE"].includes(gender) ? gender : "MALE"
    }

    if (level) {
        level = /L_(100|200|300|400|500|600|700|800|900|10000)/.test(level) ? level : "L_100"
    }

    const attendanceRegisterStudentsCount = await prismaClient.attendanceRegisterStudent.count({
        where: {
            attendanceRegisterId: registerId,
            student: {
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
            }
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            count: attendanceRegisterStudentsCount
        },
        error: null
    })
})

export default RegisterRoute