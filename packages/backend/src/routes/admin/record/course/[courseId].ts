import express from "express"
import { idValidator } from "../../../../middleware/index.js"
import { removeSpecialChar } from "../../../../utils/index.js"
import { $Enums, PrismaClient } from "@prisma/client"

interface CourseIDRequestBody {
    title: string
    code: string
    level: $Enums.Level
    semester: $Enums.Semester
    departmentId: string
}

const CourseIDRoute = express.Router()

CourseIDRoute.get("/:courseId", idValidator("courseId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let courseId = req.params.courseId

    let course = await prismaClient.course.findUnique({
        where: {
            id: courseId
        },
        select: {
            id: true,
            title: true,
            code: true,
            semester: true,
            level: true,
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

    if (!course) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Course not found",
                code: 3015
            },
            data: null
        })
        return
    }

    const { id, title, semester, code, level, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = course
    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            code,
            title,
            level,
            semester,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

CourseIDRoute.patch("/:courseId", idValidator("courseId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let courseId = req.params.courseId

    let coursesCount = await prismaClient.course.findUnique({
        where: {
            id: courseId
        },
        select: {
            department: {
                select: {
                    levels: true
                }
            }
        }
    })

    if (!coursesCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Course not found",
                code: 3015
            },
            data: null
        })
        return
    }

    let body: CourseIDRequestBody = req.body || {}
    let updateData: Partial<CourseIDRequestBody> = {}

    if (body.departmentId) {
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

        updateData.departmentId = body.departmentId
    }

    if (body.title) {
        updateData.title = body.title.toUpperCase()
    }

    if (body.code) {
        body.code = removeSpecialChar((body.code || String()).toUpperCase())
        if (!/^([abcdefghijklmnopqrstwuxyz]){1,}(\d+)$/i.test(body.code)) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Invalid course code format",
                    code: 3010
                },
                data: null
            })
            return
        }

        const coursesCountByCode = await prismaClient.course.count({
            where: {
                code: body.code,
                id: {
                    not: {
                        equals: courseId
                    }
                }
            }
        })

        if (coursesCountByCode > 0) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Course already exist",
                    code: 3013
                },
                data: null
            })
            return
        }

        updateData.code = body.code
    }

    if (body.level) {
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

        if (!coursesCount.department.levels.includes(body.level as $Enums.Level)) {
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

        updateData.level = body.level
    }

    if (body.semester) {
        if (!/FIRST|SECOND/.test(body.semester)) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Invalid semester format",
                    code: 3012
                },
                data: null
            })
            return
        }

        updateData.semester = body.semester
    }

    const course = await prismaClient.course.update({
        data: updateData,
        where: {
            id: courseId
        },
        select: {
            id: true,
            title: true,
            code: true,
            semester: true,
            level: true,
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

    const { id, title, semester, code, level, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = course
    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            code,
            title,
            level,
            semester,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

CourseIDRoute.delete("/:courseId", idValidator("courseId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let courseId = req.params.courseId

    let coursesCount = await prismaClient.course.count({
        where: {
            id: courseId
        }
    })

    if (coursesCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Course not found",
                code: 3015
            },
            data: null
        })
        return
    }

    const course = await prismaClient.course.delete({
        where: {
            id: courseId
        },
        select: {
            id: true,
            title: true,
            code: true,
            semester: true,
            level: true,
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

    const { id, title, semester, code, level, createdAt, updatedAt, department: { name: departmentName, faculty: { name: facultyName } } } = course
    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            code,
            title,
            level,
            semester,
            department: departmentName,
            faculty: facultyName,
            createdAt,
            updatedAt
        },
        error: null
    })
})

export default CourseIDRoute