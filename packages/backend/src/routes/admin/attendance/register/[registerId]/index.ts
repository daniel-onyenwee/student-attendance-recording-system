import express from "express"
import { idValidator } from "../../../../../middleware/index.js"
import {
    attendanceRegisterDecisionExpressionTypeChecker,
    attendanceRegisterStudentDecisionDeterminer,
    prismaClient
} from "../../../../../utils/index.js"
import RegisterIDRecordRoute from "./record.js"

interface RegisterIDRequestBody {
    courseId: string
    session: string
    decision: any[]
    lecturerIds: string[]
    studentIds: string[]
}

type ArrangeBy = "classAttendeeName" | "classAttendeeRegno"

type ArrangeOrder = "asc" | "desc"

interface AttendanceRegisterStudentSurnameQueryOrderByObject {
    student: {
        surname?: ArrangeOrder
    }
}

interface AttendanceRegisterStudentOtherNamesQueryOrderByObject {
    student: {
        otherNames?: ArrangeOrder
    }
}

type QueryOrderByObject = {
    student: {
        regno?: ArrangeOrder
    }
} | (AttendanceRegisterStudentSurnameQueryOrderByObject | AttendanceRegisterStudentOtherNamesQueryOrderByObject)[]

const RegisterIDRoute = express.Router()

RegisterIDRoute.get("/:registerId", idValidator("registerId"), async (req, res) => {
    let registerId = req.params.registerId
    let url = new URL(req.url || String(), `http://${req.headers.host}`)
    let classAttendeeName = url.searchParams.get("classAttendeeName") || String()
    let classAttendeeRegno = url.searchParams.get("classAttendeeRegno") || String()

    let page = +(url.searchParams.get("page") ?? 1)
    page = !isNaN(page) ? page : 1
    page = page > 0 ? page - 1 : 0

    let count = +(url.searchParams.get("count") ?? 10)
    count = !isNaN(count) ? count : 10
    count = count > 0 ? count < 1000 ? count : 1000 : 10

    let getAllRecord = url.searchParams.has("all")

    let searchBy: ArrangeBy = "classAttendeeName"
    if (url.searchParams.has("by")) {
        let searchParamValue = url.searchParams.get("by") || ""
        searchBy = ["classAttendeeName", "classAttendeeRegno"].includes(searchParamValue) ? searchParamValue as ArrangeBy : "classAttendeeName"
    }

    let searchOrder: ArrangeOrder = "asc"
    if (url.searchParams.has("order")) {
        let searchParamValue = url.searchParams.get("order") || ""
        searchOrder = ["asc", "desc"].includes(searchParamValue) ? searchParamValue as ArrangeOrder : "asc"
    }

    let orderBy: QueryOrderByObject = {
        student: {}
    }

    if (searchBy == "classAttendeeRegno") {
        orderBy.student = {
            regno: searchOrder
        }
    } else {
        orderBy = [
            {
                student: {
                    otherNames: searchOrder
                }
            },
            {
                student: {
                    surname: searchOrder
                }
            }
        ]
    }

    let attendanceRegister = await prismaClient.attendanceRegister.findUnique({
        where: {
            id: registerId
        },
        select: {
            id: true,
            decision: true,
            session: true,
            attendanceRegisterLecturers: {
                select: {
                    lecturer: {
                        select: {
                            surname: true,
                            otherNames: true,
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
                    }
                }
            },
            attendanceRegisterStudents: {
                skip: !getAllRecord ? page * count : undefined,
                take: !getAllRecord ? count : undefined,
                orderBy,
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
                where: {
                    student: {
                        regno: {
                            contains: classAttendeeRegno,
                            mode: "insensitive"
                        },
                        OR: [
                            {
                                surname: {
                                    contains: classAttendeeName,
                                    mode: "insensitive"
                                }
                            },
                            {
                                otherNames: {
                                    contains: classAttendeeName,
                                    mode: "insensitive"
                                }
                            },
                            {
                                otherNames: {
                                    in: classAttendeeName.split(/\s+/),
                                    mode: "insensitive"
                                }
                            },
                            {
                                surname: {
                                    in: classAttendeeName.split(/\s+/),
                                    mode: "insensitive"
                                }
                            }
                        ]
                    }
                }
            },
            course: {
                select: {
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
                    }
                }
            },
            createdAt: true,
            updatedAt: true,
        }
    })

    if (!attendanceRegister) {
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

    const {
        course: {
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            }, ...otherCourseData
        },
        attendanceRegisterStudents,
        attendanceRegisterLecturers,
        ...otherData
    } = attendanceRegister

    let attendanceRegisterStudentIds = attendanceRegisterStudents.map(({ id }) => id)

    let classAttendances = await prismaClient.classAttendance.findMany({
        where: {
            attendanceRegisterId: registerId
        },
        orderBy: {
            date: "asc"
        },
        select: {
            date: true,
            classAttendees: {
                where: {
                    attendanceRegisterStudentId: {
                        in: attendanceRegisterStudentIds
                    }
                },
                select: {
                    attendanceRegisterStudentId: true
                }
            }
        }
    })

    const numberOfClassTaught = classAttendances.length

    const classesDate = classAttendances.map(({ date }) => date)

    const lecturers = attendanceRegisterLecturers
        .map(({ lecturer }) => {
            const {
                gender,
                department: {
                    name: departmentName,
                    faculty: {
                        name: facultyName
                    }
                },
                surname,
                otherNames
            } = lecturer

            return ({
                name: `${surname} ${otherNames}`.toUpperCase(),
                gender,
                department: departmentName,
                faculty: facultyName
            })
        })

    const students = attendanceRegisterStudents
        .map(({ id, student: { otherNames, surname, department: { name: departmentName, faculty: { name: facultyName } }, ...otherStudentData } }) => {
            let attendances: Record<string, "PRESENT" | "ABSENT"> = {}
            let studentNumberOfClassAttended = 0
            let studentPercentageOfClassAttended = 0

            classAttendances.forEach(({ date, classAttendees }) => {
                let isPresent = classAttendees.map(({ attendanceRegisterStudentId }) => attendanceRegisterStudentId).includes(id)
                if (isPresent) {
                    studentNumberOfClassAttended += 1
                }
                attendances[date.toISOString()] = isPresent ? "PRESENT" : "ABSENT"
            })

            studentPercentageOfClassAttended = ((studentNumberOfClassAttended / numberOfClassTaught) * 100)

            return ({
                id,
                ...otherStudentData,
                name: `${surname} ${otherNames}`.toString(),
                department: departmentName,
                faculty: facultyName,
                attendances,
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
                    structuredClone(attendanceRegister.decision) as any,
                    "AND"
                )
            })
        })

    res.status(200)
    res.json({
        ok: true,
        data: {
            ...otherCourseData,
            ...otherData,
            department: departmentName,
            faculty: facultyName,
            classesTaught: numberOfClassTaught,
            classesDate,
            lecturers,
            students
        },
        error: null
    })
})

RegisterIDRoute.patch("/:registerId", idValidator("registerId"), async (req, res) => {
    let registerId = req.params.registerId

    let attendanceRegistersCount = await prismaClient.attendanceRegister.findUnique({
        where: {
            id: registerId
        },
        select: {
            courseId: true,
            session: true,
            attendanceRegisterLecturers: {
                select: {
                    lecturerId: true
                }
            },
            attendanceRegisterStudents: {
                select: {
                    studentId: true
                }
            }
        }
    })

    if (!attendanceRegistersCount) {
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

    let body: RegisterIDRequestBody = req.body || {}
    let updateData: Partial<RegisterIDRequestBody> = {}

    if (body.courseId) {
        let coursesCount = await prismaClient.course.count({
            where: {
                id: body.courseId
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

        updateData.courseId = body.courseId
    }

    if (body.session) {
        if (!/^(\d{4})\/(\d{4})$/.test(body.session)) {
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

        updateData.session = body.session
    }

    if (body.decision) {
        if (!Array.isArray(body.decision)) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Invalid decision format",
                    code: 4006
                },
                data: null
            })
            return
        }

        let decisionTypeChecking = attendanceRegisterDecisionExpressionTypeChecker(body.decision)

        if (decisionTypeChecking.status == "failed") {
            res.status(400)
            res.json({
                ok: false,
                error: decisionTypeChecking.error,
                data: null
            })
            return
        }

        updateData.decision = body.decision
    }

    if (updateData.courseId || updateData.session) {
        const attendanceRegistersCountByCourseIdSession = await prismaClient.attendanceRegister.count({
            where: {
                session: updateData.session || attendanceRegistersCount.session,
                courseId: updateData.courseId || attendanceRegistersCount.courseId,
                id: {
                    not: {
                        equals: registerId
                    }
                }
            }
        })

        if (attendanceRegistersCountByCourseIdSession > 0) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    code: 4014,
                    message: "Attendance register already exist"
                },
                data: null
            })
            return
        }
    }

    if (body.lecturerIds) {
        updateData.lecturerIds = (await prismaClient.lecturer.findMany({
            where: {
                id: {
                    in: body.lecturerIds
                }
            },
            select: {
                id: true
            }
        })).map(({ id }) => id)
    }

    if (body.studentIds) {
        updateData.studentIds = (await prismaClient.student.findMany({
            where: {
                id: {
                    in: body.studentIds
                }
            },
            select: {
                id: true
            }
        })).map(({ id }) => id)
    }

    let filteredStudentIds = (updateData.studentIds || []).map((id) => ({ studentId: id }))

    let filteredLecturerIds = (updateData.lecturerIds || []).map((id) => ({ lecturerId: id }))

    const attendanceRegister = await prismaClient.attendanceRegister.update({
        where: {
            id: registerId
        },
        data: {
            decision: updateData.decision,
            courseId: updateData.courseId,
            session: updateData.session,
            attendanceRegisterLecturers: updateData.lecturerIds ? {
                deleteMany: {
                    lecturerId: {
                        notIn: updateData.lecturerIds
                    }
                },
                createMany: {
                    data: filteredLecturerIds,
                    skipDuplicates: true
                }
            } : undefined,
            attendanceRegisterStudents: updateData.lecturerIds ? {
                deleteMany: {
                    studentId: {
                        notIn: updateData.studentIds
                    }
                },
                createMany: {
                    data: filteredStudentIds,
                    skipDuplicates: true
                }
            } : undefined
        },
        select: {
            id: true,
            decision: true,
            session: true,
            course: {
                select: {
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
                    }
                }
            },
            createdAt: true,
            updatedAt: true,
        }
    })

    const {
        course: {
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            }, ...otherCourseData
        },
        ...otherData
    } = attendanceRegister

    res.status(200)
    res.json({
        ok: true,
        data: {
            department: departmentName,
            faculty: facultyName,
            ...otherCourseData,
            ...otherData
        },
        error: null
    })
})

RegisterIDRoute.delete("/:registerId", idValidator("registerId"), async (req, res) => {
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

    const attendanceRegister = await prismaClient.attendanceRegister.delete({
        where: {
            id: registerId
        },
        select: {
            id: true,
            decision: true,
            session: true,
            course: {
                select: {
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
                    }
                }
            },
            createdAt: true,
            updatedAt: true,
        }
    })

    const {
        course: {
            department: {
                name: departmentName,
                faculty: {
                    name: facultyName
                }
            }, ...otherCourseData
        },
        ...otherData
    } = attendanceRegister

    res.status(200)
    res.json({
        ok: true,
        data: {
            department: departmentName,
            faculty: facultyName,
            ...otherCourseData,
            ...otherData
        },
        error: null
    })
})

RegisterIDRoute.use("/", RegisterIDRecordRoute)

export default RegisterIDRoute
