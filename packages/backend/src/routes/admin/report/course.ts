import express from "express"
import { idValidator } from "../../../middleware/index.js"
import "dotenv/config"
import { $Enums, PrismaClient } from "@prisma/client"
import {
    attendanceRegisterStudentDecisionDeterminer,
    createExcelFile,
    differenceInTimePeriods
} from "../../../utils/index.js"
import { format } from "date-fns"
import { PassThrough } from "node:stream"

type ArrangeBy = "name" | "regno"

type ArrangeOrder = "asc" | "desc"

interface surnameQueryOrderByObject {
    student: {
        surname?: ArrangeOrder
    }
}

interface otherNamesQueryOrderByObject {
    student: {
        otherNames?: ArrangeOrder
    }
}


type QueryOrderByObject = {
    student: {
        regno?: ArrangeOrder
    }
} | (surnameQueryOrderByObject | otherNamesQueryOrderByObject)[]

const CourseRoute = express.Router()

CourseRoute.get("/:courseId/:session", idValidator("courseId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let courseId = req.params.courseId
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

    const courseCount = await prismaClient.course.findUnique({
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
        }
    })

    if (!courseCount) {
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

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    let searchBy: ArrangeBy = "name"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "regno"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "name"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {
        student: {}
    }

    if (searchBy == "regno") {
        orderBy.student["regno"] = searchOrder
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
    }

    let report = await generateCourseReport({
        prismaClient,
        courseId,
        name,
        regno,
        session,
        orderBy,
        getAllRecord,
        page,
        count
    })

    const {
        id,
        title,
        semester,
        code,
        level,
        department: {
            name: departmentName,
            faculty: {
                name: facultyName
            }
        }
    } = courseCount

    res.status(200)
    res.json({
        ok: true,
        data: {
            metadata: {
                totalClasses: report.totalClasses,
                classesDate: report.classesDate,
                totalClassesInHour: report.totalClassesInHour,
                code,
                title,
                level,
                semester,
                department: departmentName,
                faculty: facultyName,
            },
            report: report.attendances
        },
        error: null
    })
})

CourseRoute.get("/download/:courseId/:session", idValidator("courseId"), async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let courseId = req.params.courseId
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

    const courseCount = await prismaClient.course.findUnique({
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
        }
    })

    if (!courseCount) {
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

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let name = url.searchParams.get("name") || String()
    let regno = url.searchParams.get("regno") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    let searchBy: ArrangeBy = "name"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["name", "regno"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "name"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {
        student: {}
    }

    if (searchBy == "regno") {
        orderBy.student["regno"] = searchOrder
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
    }

    let report = await generateCourseReport({
        prismaClient,
        courseId,
        name,
        regno,
        session,
        orderBy,
        getAllRecord,
        page,
        count
    })

    let fileName = `${courseCount.code}_${session}_Report`

    let fileData = await createExcelFile({
        title: fileName,
        created: new Date(),
        firstHeader: fileName,
        creator: "SAR system",
        columns: [
            { header: "Name", key: "name", width: 35 },
            { header: "Regno", key: "regno", width: 20 },
            { header: "Decision", key: "decision", width: 10 },
            ...(report.classesDate.map(({ id, date, endTime, startTime }) => {
                return ({
                    key: id,
                    width: 22,
                    header: `${format(date, "LL/dd/yyyy")}\n${format(startTime, "hh:mm aaa")} - ${format(endTime, "hh:mm aaa")}`
                })
            })),
            { header: "Classes attended", key: "classesAttended", width: 20 },
            { header: "Classes attended percentage", width: 30, key: "classesAttendedPercentage" }
        ]
    }, report.attendances)

    var readStream = new PassThrough()
    readStream.end(fileData)

    res.set("Content-disposition", "attachment; filename=" + `${fileName}.xlsx`)
    res.set("Content-Type", "application/vnd.ms-excel")

    res.status(200)
    readStream.pipe(res)
})

async function generateCourseReport({ prismaClient, courseId, session, name = undefined, regno = undefined, orderBy = { student: {} }, page = 1, count = 100, getAllRecord = false }:
    { prismaClient: PrismaClient; courseId: string; session: string; name?: string | undefined; regno?: string | undefined; orderBy?: QueryOrderByObject; page?: number; count?: number; getAllRecord?: boolean }) {
    let attendanceRegisterQuery = await prismaClient.attendanceRegister.findUnique({
        where: {
            courseId_session: {
                courseId,
                session
            }
        },
        select: {
            decision: true,
            classAttendances: {
                orderBy: {
                    date: "asc"
                },
                where: {
                    status: $Enums.ClassAttendanceStatus.COMPLETED,
                },
                select: {
                    id: true,
                    date: true,
                    startTime: true,
                    endTime: true,
                    classAttendees: {
                        select: {
                            attendanceRegisterStudentId: true
                        }
                    }
                }
            },
            attendanceRegisterStudents: {
                where: {
                    student: {
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
                                otherNames: name ? {
                                    in: name.split(/\s+/),
                                    mode: "insensitive"
                                } : undefined
                            },
                            {
                                surname: name ? {
                                    in: name.split(/\s+/),
                                    mode: "insensitive"
                                } : undefined
                            }
                        ],
                    }
                },
                orderBy,
                skip: !getAllRecord ? page * count : undefined,
                take: !getAllRecord ? count : undefined,
                select: {
                    id: true,
                    student: {
                        select: {
                            surname: true,
                            otherNames: true,
                            level: true,
                            gender: true,
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
                            }
                        }
                    }
                },
            }
        }
    })

    if (!attendanceRegisterQuery) {
        return {
            totalClasses: 0,
            totalClassesInHour: 0,
            classesDate: [] as { id: string, date: Date, startTime: Date, endTime: Date }[],
            attendances: [] as any
        }
    }

    const {
        attendanceRegisterStudents,
        decision,
        classAttendances
    } = attendanceRegisterQuery

    const numberOfClassTaught = classAttendances.length

    const classesDate = classAttendances.map(({ classAttendees: _, ...otherClassAttendanceData }) => ({ ...otherClassAttendanceData }))

    const totalClassesInHour = differenceInTimePeriods("hour", classAttendances.map(({ startTime, endTime }) => ({ startTime, endTime })))

    const students = attendanceRegisterStudents
        .map(({ id, student: { otherNames, surname, department: { name: departmentName, faculty: { name: facultyName } }, ...otherStudentData } }) => {
            let attendances: Record<string, 1 | 0> = {}
            let studentNumberOfClassAttended = 0
            let studentPercentageOfClassAttended = 0

            classAttendances.forEach(({ id: classAttendanceId, classAttendees }) => {
                let isPresent = classAttendees.map(({ attendanceRegisterStudentId }) => attendanceRegisterStudentId).includes(id)
                if (isPresent) {
                    studentNumberOfClassAttended += 1
                }
                attendances[classAttendanceId] = isPresent ? 1 : 0
            })

            studentPercentageOfClassAttended = ((studentNumberOfClassAttended / numberOfClassTaught) * 100)

            return ({
                id,
                name: `${surname} ${otherNames}`.toString(),
                surname,
                otherNames,
                regno: otherStudentData.regno,
                ...attendances,
                classesAttended: studentNumberOfClassAttended,
                classesAttendedPercentage: studentPercentageOfClassAttended,
                numberOfClassTaught,
                decision: attendanceRegisterStudentDecisionDeterminer(
                    {
                        StudentName: `${surname} ${otherNames}`.toString(),
                        StudentDepartment: departmentName,
                        StudentFaculty: facultyName,
                        StudentRegno: otherStudentData.regno,
                        StudentGender: otherStudentData.gender,
                        StudentLevel: otherStudentData.level,
                        StudentNumberOfClassAttended: studentNumberOfClassAttended,
                        StudentPercentageOfClassAttended: studentPercentageOfClassAttended,
                        NumberOfClassTaught: numberOfClassTaught
                    },
                    structuredClone(decision) as any,
                    "AND"
                )
            })
        })

    return {
        totalClasses: numberOfClassTaught,
        classesDate,
        totalClassesInHour,
        attendances: students
    }
}

export default CourseRoute