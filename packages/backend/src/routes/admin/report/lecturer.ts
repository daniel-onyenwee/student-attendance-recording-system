import express from "express"
import { idValidator } from "../../../middleware/index.js"
import { $Enums, PrismaClient } from "@prisma/client"
import { createExcelFile, differenceInTimePeriods } from "../../../utils/index.js"
import { PassThrough } from "node:stream"

type ArrangeBy = "courseTitle" | "courseCode" | "semester"

type ArrangeOrder = "asc" | "desc"

type QueryOrderByObject = {
    course: Partial<Record<"code" | "title" | "semester", ArrangeOrder>>
}

const LecturerRoute = express.Router()

LecturerRoute.get("/:lecturerId/:session", idValidator("lecturerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.params.lecturerId
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

    const lecturerCount = await prismaClient.lecturer.findUnique({
        where: {
            id: lecturerId
        },
        select: {
            id: true,
            surname: true,
            gender: true,
            otherNames: true,
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
    })

    if (!lecturerCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Lecturer not found",
                code: 3020
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
        id,
        surname,
        otherNames,
        gender,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = lecturerCount

    let report = await generateLecturerReport({
        prismaClient,
        lecturerId,
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
            id,
            name: `${surname} ${otherNames}`.toUpperCase(),
            gender,
            department: departmentName,
            faculty: facultyName,
            courses: report
        },
        error: null
    })
})

LecturerRoute.get("/download/:lecturerId/:session", idValidator("lecturerId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let lecturerId = req.params.lecturerId
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

    const lecturerCount = await prismaClient.lecturer.findUnique({
        where: {
            id: lecturerId
        },
        select: {
            username: true,
        }
    })

    if (!lecturerCount) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Lecturer not found",
                code: 3020
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

    let report = await generateLecturerReport({
        prismaClient,
        lecturerId,
        courseCode,
        semester,
        courseTitle,
        session,
        orderBy,
        getAllRecord,
        page,
        count
    })

    let fileName = `${lecturerCount.username}_${session}_Report`

    let excelFileColumns = [
        { header: "Course title", key: "courseTitle", width: 35 },
        { header: "Course code", key: "courseCode", width: 15 },
        { header: "Semester", key: "semester", width: 15 },
        { header: "Total classes", key: "totalClasses", width: 15 },
        { header: "Total classes in hour", key: "totalClassesInHour", width: 23 },
        { header: "Classes taught", key: "classesTaught", width: 20 },
        { header: "Classes taught in hour", key: "classesTaughtInHour", width: 23 },
        { header: "Classes taught percentage", width: 28, key: "classesTaughtPercentage" }
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

async function generateLecturerReport(
    { prismaClient, lecturerId, session, courseCode = undefined, courseTitle = undefined, semester = undefined, orderBy = { course: {} }, page = 1, count = 100, getAllRecord = false }:
        { prismaClient: PrismaClient; lecturerId: string; session: string; courseCode?: string | undefined; courseTitle?: string | undefined; semester?: string | undefined; orderBy?: QueryOrderByObject; page?: number; count?: number; getAllRecord?: boolean }) {
    let attendanceRegistersQuery = await prismaClient.attendanceRegister.findMany({
        where: {
            session: session,
            attendanceRegisterLecturers: {
                some: {
                    lecturerId: lecturerId
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
                },
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
            classAttendances: {
                where: {
                    status: $Enums.ClassAttendanceStatus.COMPLETED
                },
                select: {
                    _count: true,
                    startTime: true,
                    endTime: true,
                    attendanceRegisterLecturer: {
                        select: {
                            lecturerId: true
                        }
                    }
                }
            }
        }
    })

    let courses = attendanceRegistersQuery.map(({ id, course, classAttendances }) => {
        let lecturerClassAttendances = classAttendances
            .filter(({ attendanceRegisterLecturer }) => attendanceRegisterLecturer.lecturerId == lecturerId)
        return ({
            id,
            courseCode: course.code,
            courseTitle: course.title,
            totalClasses: classAttendances.length,
            semester: course.semester,
            totalClassesInHour: differenceInTimePeriods("hour", classAttendances.map(({ startTime, endTime }) => ({ startTime, endTime }))),
            classesTaught: lecturerClassAttendances.length,
            classesTaughtInHour: differenceInTimePeriods("hour", lecturerClassAttendances.map(({ startTime, endTime }) => ({ startTime, endTime }))),
            classesTaughtPercentage: (lecturerClassAttendances.length / classAttendances.length) * 100
        })
    })

    return courses
}

export default LecturerRoute