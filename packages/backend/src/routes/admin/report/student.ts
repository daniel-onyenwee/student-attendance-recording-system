import express from "express"
import { idValidator } from "../../../middleware/index.js"
import { $Enums, PrismaClient } from "@prisma/client"
import { createExcelFile } from "../../../utils/index.js"
import { PassThrough } from "node:stream"

type ArrangeBy = "courseTitle" | "courseCode" | "semester"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = {
    course: Partial<Record<"code" | "title" | "semester", ArrangeOrder>>
}

const StudentRoute = express.Router()

StudentRoute.get("/:studentId/:session", idValidator("studentId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let studentId = req.params.studentId
    let session = req.params.session

    if (!/^(\d{4})\/(\d{4})$/.test(session)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid session format",
                code: 4005
            },
            data: null
        })
        return
    }

    const studentCount = await prismaClient.student.findUnique({
        where: {
            id: studentId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
            regno: true,
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
            }
        }
    })

    if (!studentCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Student not found",
                code: 3023
            },
            data: null
        })
        return
    }

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let courseCode = url.searchParams.get("courseCode") || String()
    let courseTitle = url.searchParams.get("courseTitle") || String()
    let semester = url.searchParams.get("semester") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }

    let searchBy: ArrangeBy = "courseTitle"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["courseTitle", "courseCode", "semester"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "courseTitle"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {
        course: {}
    }

    if (searchBy == "courseCode") {
        orderBy.course["code"] = searchOrder
    } else if (searchBy == "courseTitle") {
        orderBy.course["title"] = searchOrder
    } else {
        orderBy.course[searchBy] = searchOrder
    }

    const {
        surname,
        otherNames,
        regno,
        level,
        gender,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = studentCount

    let report = await generateStudentReport({
        prismaClient,
        studentId,
        courseCode,
        semester,
        courseTitle,
        session,
        orderBy,
        getAllRecord,
        page,
        count
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            metadata: {
                name: `${surname} ${otherNames}`.toUpperCase(),
                regno,
                surname,
                otherNames,
                level,
                gender,
                department: departmentName,
                faculty: facultyName,
            },
            report
        },
        error: null
    })
})

StudentRoute.get("/download/:studentId/:session", idValidator("studentId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let studentId = req.params.studentId
    let session = req.params.session

    if (!/^(\d{4})\/(\d{4})$/.test(session)) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Invalid session format",
                code: 4005
            },
            data: null
        })
        return
    }

    const studentCount = await prismaClient.student.findUnique({
        where: {
            id: studentId
        },
        select: {
            regno: true,
        }
    })

    if (!studentCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Student not found",
                code: 3023
            },
            data: null
        })
        return
    }

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let courseCode = url.searchParams.get("courseCode") || String()
    let courseTitle = url.searchParams.get("courseTitle") || String()
    let semester = url.searchParams.get("semester") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    if (semester) {
        semester = ["FIRST", "SECOND"].includes(semester) ? semester : "FIRST"
    }


    let searchBy: ArrangeBy = "courseTitle"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["courseTitle", "courseCode", "semester"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "courseTitle"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {
        course: {}
    }

    if (searchBy == "courseCode") {
        orderBy.course["code"] = searchOrder
    } else if (searchBy == "courseTitle") {
        orderBy.course["title"] = searchOrder
    } else {
        orderBy.course[searchBy] = searchOrder
    }

    let report = await generateStudentReport({
        prismaClient,
        studentId,
        courseCode,
        semester,
        courseTitle,
        session,
        orderBy,
        getAllRecord,
        page,
        count
    })

    let fileName = `${studentCount.regno}_${session}_Report`

    let excelFileColumns = [
        { header: "Course title", key: "courseTitle", width: 35 },
        { header: "Course code", key: "courseCode", width: 15 },
        { header: "Semester", key: "semester", width: 15 },
        { header: "Total classes", key: "totalClasses", width: 15 },
        { header: "Classes attended", key: "classesAttended", width: 20 },
        { header: "Classes attended percentage", width: 30, key: "classesAttendedPercentage" }
    ]

    let fileData = await createExcelFile({
        title: fileName,
        created: new Date(),
        firstHeader: fileName,
        creator: "SAR system",
        columns: excelFileColumns
    }, report)

    var readStream = new PassThrough()
    readStream.end(fileData)

    res.set("Content-disposition", "attachment; filename=" + `${fileName}.xlsx`)
    res.set("Content-Type", "application/vnd.ms-excel")

    res.status(200)
    readStream.pipe(res)
})

async function generateStudentReport(
    { prismaClient, studentId, session, courseCode = undefined, courseTitle = undefined, semester = undefined, orderBy = { course: {} }, page = 1, count = 100, getAllRecord = false }:
        { prismaClient: PrismaClient; studentId: string; session: string; courseCode?: string | undefined; courseTitle?: string | undefined; semester?: string | undefined; orderBy?: QueryOrderByObject; page?: number; count?: number; getAllRecord?: boolean }
) {
    let attendanceRegistersQuery = await prismaClient.attendanceRegister.findMany({
        where: {
            session: session,
            attendanceRegisterStudents: {
                some: {
                    studentId: studentId
                }
            },
            course: {
                semester: semester ? {
                    equals: semester as $Enums.Semester
                } : undefined,
                title: {
                    contains: courseTitle,
                    mode: "insensitive"
                },
                code: {
                    contains: courseCode,
                    mode: "insensitive"
                }
            }
        },
        orderBy,
        skip: !getAllRecord ? page * count : undefined,
        take: !getAllRecord ? count : undefined,
        select: {
            id: true,
            course: {
                select: {
                    code: true,
                    title: true,
                    semester: true
                }
            },
            _count: {
                select: {
                    classAttendances: true
                }
            },
            classAttendances: {
                select: {
                    _count: true
                },
                where: {
                    status: $Enums.ClassAttendanceStatus.COMPLETED,
                    classAttendees: {
                        some: {
                            attendanceRegisterStudent: {
                                studentId: studentId
                            }
                        }
                    }
                }
            }
        }
    })

    let courses = attendanceRegistersQuery.map(({ id, course, _count, classAttendances }) => {
        return ({
            id,
            courseCode: course.code,
            courseTitle: course.title,
            semester: course.semester,
            totalClasses: _count.classAttendances,
            classesAttended: classAttendances.length,
            classesAttendedPercentage: (classAttendances.length / _count.classAttendances) * 100
        })
    })

    return courses
}


export default StudentRoute