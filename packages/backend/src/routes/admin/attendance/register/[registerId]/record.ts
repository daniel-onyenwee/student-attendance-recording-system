import express from "express"
import { idValidator } from "../../../../../middleware/index.js"
import { $Enums, PrismaClient } from "@prisma/client"

type BasicArrangeBy = "name" | "gender" | "updatedAt" | "createdAt" | "department" | "faculty"

type ArrangeBy<T extends "Lecturer" | "Student" = "Lecturer"> = T extends "Student" ? "regno" | "level" | BasicArrangeBy : "username" | BasicArrangeBy

type ArrangeOrder = "asc" | "desc"

type surnameQueryOrderByObject<T extends "Lecturer" | "Student" = "Lecturer"> = T extends "Lecturer" ? {
    lecturer: {
        surname?: ArrangeOrder
    }
} : {
    student: {
        surname?: ArrangeOrder
    }
}

type otherNamesQueryOrderByObject<T extends "Lecturer" | "Student" = "Lecturer"> = T extends "Lecturer" ? {
    lecturer: {
        otherNames?: ArrangeOrder
    }
} : {
    student: {
        otherNames?: ArrangeOrder
    }
}

type QueryOrderByObject<T extends "Lecturer" | "Student" = "Lecturer"> = (T extends "Lecturer" ?
    {
        createdAt?: ArrangeOrder
        updatedAt?: ArrangeOrder
        lecturer: Partial<Omit<Record<ArrangeBy<T>, ArrangeOrder>, "department" | "name" | "faculty" | "createdAt" | "updatedAt">> & {
            department?: Partial<{
                name: ArrangeOrder,
                faculty: {
                    name: ArrangeOrder,
                }
            }>,
        }
    } :
    {
        createdAt?: ArrangeOrder
        updatedAt?: ArrangeOrder
        student: Partial<Omit<Record<ArrangeBy<T>, ArrangeOrder>, "department" | "name" | "faculty">> & {
            department?: Partial<{
                name: ArrangeOrder,
                faculty: {
                    name: ArrangeOrder,
                }
            }>,
        }
    }
) | (surnameQueryOrderByObject<T> | otherNamesQueryOrderByObject<T>)[]


const RegisterIDRecordRoute = express.Router()

RegisterIDRecordRoute.get("/:registerId/lecturer", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            id: registerId
        }
    })

    if (attendanceRegistersCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
        return
    }

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let username = url.searchParams.get("username") || String()
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

    let searchBy: ArrangeBy<"Lecturer"> = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "gender", "updatedAt", "createdAt", "username", "department", "faculty"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject<"Lecturer"> = {
        lecturer: {}
    }

    if (searchBy == "department") {
        orderBy.lecturer = {
            department: {
                name: searchOrder
            }
        }
    } else if (searchBy == "faculty") {
        orderBy.lecturer = {
            department: {
                faculty: {
                    name: searchOrder
                }
            }
        }
    } else if (searchBy == "name") {
        orderBy = [
            {
                lecturer: {
                    surname: searchOrder,
                }
            },
            {
                lecturer: {
                    otherNames: searchOrder
                }
            }
        ]
    } else if (searchBy == "createdAt" || searchBy == "updatedAt") {
        delete Object(orderBy).lecturer
        orderBy[searchBy] = searchOrder
    } else {
        orderBy.lecturer = {
            [searchBy]: searchOrder
        }
    }

    const lecturersQuery = await prismaClient.attendanceRegisterLecturer.findMany({
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
                username: {
                    contains: username,
                    mode: "insensitive"
                },
                gender: gender ? {
                    equals: gender as $Enums.Gender
                } : undefined
            }
        },
        select: {
            id: true,
            lecturer: {
                select: {
                    surname: true,
                    otherNames: true,
                    username: true,
                    gender: true,
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
                }
            },
            createdAt: true,
            updatedAt: true
        },
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        orderBy
    })

    let lecturers = lecturersQuery.map(({ lecturer: { department: { name: departmentName, faculty: { name: facultyName } }, surname, otherNames, ...otherLecturerData }, ...otherData }) => {
        return ({
            surname,
            otherNames,
            name: `${surname} ${otherNames}`.toUpperCase(),
            ...otherData,
            ...otherLecturerData,
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

RegisterIDRecordRoute.post("/:registerId/lecturer", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            id: registerId
        }
    })

    if (attendanceRegistersCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
        return
    }

    let body: { lecturersId: string[] } = req.body || {}

    if (!body.lecturersId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'lecturersId'",
                code: 4003
            },
            data: null
        })
        return
    }

    let filteredLecturersId = (await prismaClient.lecturer.findMany({
        where: {
            id: {
                in: body.lecturersId
            }
        },
        select: {
            id: true
        }
    })).map(({ id }) => ({ lecturerId: id }))

    await prismaClient.attendanceRegister.update({
        where: {
            id: registerId
        },
        data: {
            attendanceRegisterLecturers: {
                createMany: {
                    skipDuplicates: true,
                    data: filteredLecturersId
                }
            }
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: null,
        error: null
    })
})

RegisterIDRecordRoute.delete("/:registerId/lecturer", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            id: registerId
        }
    })

    if (attendanceRegistersCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
        return
    }

    let body: { attendanceRegisterLecturersId: string[] } = req.body || {}

    body.attendanceRegisterLecturersId = body.attendanceRegisterLecturersId || []

    await prismaClient.attendanceRegisterLecturer.deleteMany({
        where: {
            attendanceRegisterId: registerId,
            id: {
                in: body.attendanceRegisterLecturersId
            }
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: null,
        error: null
    })
})

RegisterIDRecordRoute.get("/:registerId/student", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            id: registerId
        }
    })

    if (attendanceRegistersCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
        return
    }

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let department = url.searchParams.get("department") || String()
    let faculty = url.searchParams.get("faculty") || String()
    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()
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

    let searchBy: ArrangeBy<"Student"> = "createdAt"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "gender", "regno", "level", "updatedAt", "createdAt", "department", "faculty"].includes(searchParamValue) ? searchParamValue as ArrangeBy<"Student"> : "createdAt"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject<"Student"> = {
        student: {}
    }

    if (searchBy == "department") {
        orderBy.student = {
            department: {
                name: searchOrder
            }
        }
    } else if (searchBy == "faculty") {
        orderBy.student = {
            department: {
                faculty: {
                    name: searchOrder
                }
            }
        }
    } else if (searchBy == "name") {
        orderBy = [
            {
                student: {
                    surname: searchOrder,
                }
            },
            {
                student: {
                    otherNames: searchOrder
                }
            }
        ]
    } else if (searchBy == "createdAt" || searchBy == "updatedAt") {
        delete Object(orderBy).student
        orderBy[searchBy] = searchOrder
    } else {
        orderBy.student = {
            [searchBy]: searchOrder
        }
    }

    const studentsQuery = await prismaClient.attendanceRegisterStudent.findMany({
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
                gender: gender ? {
                    equals: gender as $Enums.Gender
                } : undefined
            }
        },
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        orderBy,
        select: {
            id: true,
            student: {
                select: {
                    surname: true,
                    otherNames: true,
                    gender: true,
                    level: true,
                    regno: true,
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
                }
            },
            createdAt: true,
            updatedAt: true
        }
    })

    let students = studentsQuery.map(({ student: { department: { name: departmentName, faculty: { name: facultyName } }, surname, otherNames, ...otherStudentData }, ...otherData }) => {
        return ({
            surname,
            otherNames,
            name: `${surname} ${otherNames}`.toUpperCase(),
            ...otherData,
            ...otherStudentData,
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

RegisterIDRecordRoute.post("/:registerId/student", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            id: registerId
        }
    })

    if (attendanceRegistersCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
        return
    }

    let body: { studentsId: string[] } = req.body || {}

    if (!body.studentsId) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'studentsId'",
                code: 4004
            },
            data: null
        })
        return
    }

    let filteredStudentsId = (await prismaClient.student.findMany({
        where: {
            id: {
                in: body.studentsId
            }
        },
        select: {
            id: true
        }
    })).map(({ id }) => ({ studentId: id }))

    await prismaClient.attendanceRegister.update({
        where: {
            id: registerId
        },
        data: {
            attendanceRegisterStudents: {
                createMany: {
                    skipDuplicates: true,
                    data: filteredStudentsId
                }
            }
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: null,
        error: null
    })
})

RegisterIDRecordRoute.delete("/:registerId/student", idValidator("registerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let registerId = req.params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.count({
        where: {
            id: registerId
        }
    })

    if (attendanceRegistersCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Attendance register not found",
                code: 4015
            },
            data: null
        })
        return
    }

    let body: { attendanceRegisterStudentsId: string[] } = req.body || {}

    body.attendanceRegisterStudentsId = body.attendanceRegisterStudentsId || []

    await prismaClient.attendanceRegisterStudent.deleteMany({
        where: {
            attendanceRegisterId: registerId,
            id: {
                in: body.attendanceRegisterStudentsId
            }
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: null,
        error: null
    })
})

export default RegisterIDRecordRoute