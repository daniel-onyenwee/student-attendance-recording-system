import express from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import "dotenv/config"
import { format } from "date-fns"
import { PassThrough } from "node:stream"
import { attendanceRegisterStudentDecisionDeterminer, createExcelFile } from "../utils/index.js"
import { PrismaClient } from "@prisma/client"

interface ReportData {
    fileName: string
    fileData: Buffer
}

const ReportRoute = express.Router()

ReportRoute.get("/", async (req, res) => {
    const prismaClient: PrismaClient = req.app.get("prisma-client")

    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let accessToken = url.searchParams.get("access_token") || String()

    try {
        const jwtPayload = jwt.verify(accessToken, process.env.REPORT_ACCESS_TOKEN_SECRET || "report_secret") as JwtPayload
        const recordType = jwtPayload.recordType
        const recordData = jwtPayload.recordData

        let generatedReport: ReportData | null = null

        if (recordType == "COURSE") {
            generatedReport = await generateCourseReport(prismaClient, recordData.courseId, recordData.session)
        } else if (recordType == "LECTURER") {
            generatedReport = await generateLecturerReport(prismaClient, recordData.lecturerId, recordData.session)
        } else if (recordType == "STUDENT") {
            generatedReport = await generateStudentReport(prismaClient, recordData.studentId, recordData.session)
        }

        if (generatedReport) {
            var readStream = new PassThrough()
            readStream.end(generatedReport.fileData)

            res.set("Content-disposition", "attachment; filename=" + `${generatedReport.fileName}.xlsx`)
            res.set("Content-Type", "application/vnd.ms-excel")

            readStream.pipe(res)
        } else {
            res.sendStatus(404)
        }
    } catch (error) {
        res.sendStatus(404)
    }
})

async function generateStudentReport(prismaClient: PrismaClient, studentId: string, session: string): Promise<ReportData | null> {
    const student = await prismaClient.student.findUnique({
        where: {
            id: studentId
        },
        select: {
            regno: true
        }
    })

    if (!student) return null

    let attendanceRegisterQuery = await prismaClient.attendanceRegister.findMany({
        where: {
            session: session,
            attendanceRegisterStudents: {
                some: {
                    studentId: studentId
                }
            }
        },
        select: {
            course: {
                select: {
                    code: true,
                    title: true
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

    let fileName = `${student.regno}_${session}_Report`

    let excelFileColumns = [
        { header: "Course title", key: "courseTitle", width: 35 },
        { header: "Course code", key: "courseCode", width: 15 },
        { header: "Total classes", key: "totalClasses", width: 15 },
        { header: "Classes attended", key: "classesAttended", width: 20 },
        { header: "Classes attended percentage", width: 30, key: "classesAttendedPercentage" }
    ]

    let courses = attendanceRegisterQuery.map(({ course, _count, classAttendances }) => {
        return ({
            courseCode: course.code,
            courseTitle: course.title,
            totalClasses: _count.classAttendances,
            classesAttended: classAttendances.length,
            classesAttendedPercentage: (classAttendances.length / _count.classAttendances) * 100
        })
    })

    let fileData = await createExcelFile({
        title: fileName,
        created: new Date(),
        firstHeader: fileName,
        creator: "SAR system",
        columns: excelFileColumns
    }, courses)

    return {
        fileData,
        fileName
    }
}

async function generateLecturerReport(prismaClient: PrismaClient, lecturerId: string, session: string): Promise<ReportData | null> {
    const lecturer = await prismaClient.lecturer.findUnique({
        where: {
            id: lecturerId
        },
        select: {
            username: true
        }
    })

    let attendanceRegisterQuery = await prismaClient.attendanceRegister.findMany({
        where: {
            session: session,
            attendanceRegisterLecturers: {
                some: {
                    lecturerId: lecturerId
                }
            }
        },
        select: {
            course: {
                select: {
                    code: true,
                    title: true
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
                    attendanceRegisterLecturer: {
                        lecturerId: lecturerId
                    }
                }
            }
        }
    })

    if (!lecturer) return null

    let fileName = `${lecturer.username}_${session}_Report`

    let excelFileColumns = [
        { header: "Course title", key: "courseTitle", width: 35 },
        { header: "Course code", key: "courseCode", width: 15 },
        { header: "Total classes", key: "totalClasses", width: 15 },
        { header: "Classes taught", key: "classesTaught", width: 20 },
        { header: "Classes taught percentage", width: 28, key: "classesTaughtPercentage" }
    ]

    let courses = attendanceRegisterQuery.map(({ course, _count, classAttendances }) => {
        return ({
            courseCode: course.code,
            courseTitle: course.title,
            totalClasses: _count.classAttendances,
            classesTaught: classAttendances.length,
            classesTaughtPercentage: (classAttendances.length / _count.classAttendances) * 100
        })
    })

    let fileData = await createExcelFile({
        title: fileName,
        created: new Date(),
        firstHeader: fileName,
        creator: "SAR system",
        columns: excelFileColumns
    }, courses)

    return {
        fileData,
        fileName
    }
}

async function generateCourseReport(prismaClient: PrismaClient, courseId: string, session: string): Promise<ReportData | null> {
    let attendanceRegisterQuery = await prismaClient.attendanceRegister.findUnique({
        where: {
            courseId_session: {
                courseId,
                session
            }
        },
        select: {
            decision: true,
            course: {
                select: {
                    code: true,
                    title: true
                }
            },
            classAttendances: {
                orderBy: {
                    date: "asc"
                },
                select: {
                    date: true,
                    classAttendees: {
                        select: {
                            attendanceRegisterStudentId: true
                        }
                    }
                }
            },
            attendanceRegisterStudents: {
                orderBy: {
                    student: {
                        regno: "asc"
                    }
                },
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

    let excelFileColumns = [
        { header: "Name", key: "name", width: 35 },
        { header: "Regno", key: "regno", width: 20 },
        { header: "Decision", key: "decision", width: 10 },
        { header: "Total classes", key: "totalClasses", width: 15 },
        { header: "Classes attended", key: "classesAttended", width: 20 },
        { header: "Classes attended percentage", width: 30, key: "classesAttendedPercentage" }
    ]

    if (!attendanceRegisterQuery) {
        const course = await prismaClient.course.findUnique({
            where: {
                id: courseId
            },
            select: {
                code: true
            }
        })

        if (!course) return null

        let fileName = `${course.code}_${session}_Report`

        let fileData = await createExcelFile({
            title: fileName,
            created: new Date(),
            firstHeader: fileName,
            creator: "SAR system",
            columns: excelFileColumns
        }, [])

        return {
            fileData,
            fileName
        }
    }

    const {
        course,
        attendanceRegisterStudents,
        decision,
        classAttendances
    } = attendanceRegisterQuery

    const numberOfClassTaught = classAttendances.length

    const classesDate = classAttendances.map(({ date }) => date)

    const students = attendanceRegisterStudents
        .map(({ id, student: { otherNames, surname, department: { name: departmentName, faculty: { name: facultyName } }, ...otherStudentData } }) => {
            let attendances: Record<string, 1 | 0> = {}
            let studentNumberOfClassAttended = 0
            let studentPercentageOfClassAttended = 0

            classAttendances.forEach(({ date, classAttendees }) => {
                let isPresent = classAttendees.map(({ attendanceRegisterStudentId }) => attendanceRegisterStudentId).includes(id)
                if (isPresent) {
                    studentNumberOfClassAttended += 1
                }
                attendances[format(date, "yyyyddLL")] = isPresent ? 1 : 0
            })

            studentPercentageOfClassAttended = ((studentNumberOfClassAttended / numberOfClassTaught) * 100)

            return ({
                name: `${surname} ${otherNames}`.toString(),
                regno: otherStudentData.regno,
                ...attendances,
                totalClasses: numberOfClassTaught,
                classesAttended: studentNumberOfClassAttended,
                classesAttendedPercentage: studentPercentageOfClassAttended,
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


    let fileName = `${course.code}_${session}_Report`

    let fileData = await createExcelFile({
        title: fileName,
        created: new Date(),
        firstHeader: fileName,
        creator: "SAR system",
        columns: [
            { header: "Name", key: "name", width: 35 },
            { header: "Regno", key: "regno", width: 20 },
            { header: "Decision", key: "decision", width: 10 },
            ...(classesDate.map((date) => ({ key: format(date, "yyyyddLL"), width: 22, header: format(date, "LLLL do, yyyy.") }))),
            { header: "Total classes", key: "totalClasses", width: 15 },
            { header: "Classes attended", key: "classesAttended", width: 20 },
            { header: "Classes attended percentage", width: 30, key: "classesAttendedPercentage" }
        ]
    }, students)

    return {
        fileData,
        fileName
    }
}

export default ReportRoute