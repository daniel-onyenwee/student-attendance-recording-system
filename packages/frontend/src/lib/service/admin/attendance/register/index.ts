import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption
} from "../../../type.js"
import type { AttendanceRegisterModel } from "../../types.js"

interface AttendanceRegisterServiceBody {
    courseId: string
    session: string
    decision?: any[]
    lecturerIds?: string[]
    studentIds?: string[]
}

export interface IClassAttendance {
    id: string;
    date: Date;
    startTime: Date;
    endTime: Date;
}

export interface AttendanceRegisterSortByOption extends SortByOption {
    by: "courseTitle" | "courseCode" | "session" | "semester" | "updatedAt" | "createdAt" | "department" | "faculty" | "level"
}

export interface AttendanceRegisterFilterByOption {
    level: string
    faculty: string
    department: string
    courseTitle: string
    semester: string
    session: string
    courseCode: string
}

interface GetAttendanceRegisterServiceBody extends Pagination {
    filter: Partial<AttendanceRegisterFilterByOption>
    sort: Partial<AttendanceRegisterSortByOption>
}

export const getAttendanceRegisterById: AuthenticatedServiceHandle<{ id: string }, AttendanceRegisterModel & { classAttendances: IClassAttendance[] }> = async ({ accessToken, id }) => {
    let response = await fetch(new URL(`/admin/attendance/register/${id}`, BACKEND_BASE_URL), {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getAttendanceRegisters: AuthenticatedServiceHandle<Partial<GetAttendanceRegisterServiceBody>, AttendanceRegisterModel[]> = async ({ accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL("/admin/attendance/register", BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createAttendanceRegister: AuthenticatedServiceHandle<AttendanceRegisterServiceBody, AttendanceRegisterModel> = async (data) => {
    let { accessToken, ...otherData } = data

    otherData.lecturerIds = otherData.lecturerIds || []

    otherData.studentIds = otherData.studentIds || []

    otherData.decision = otherData.decision || [
        { "type": "SingleDecision", "value": 85, "operator": "gte", "property": "StudentPercentageOfClassAttended" }
    ]

    let response = await fetch(new URL("/admin/attendance/register", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateAttendanceRegister: AuthenticatedServiceHandle<Partial<AttendanceRegisterServiceBody> & { id: string }, AttendanceRegisterModel> = async (data) => {
    let { accessToken, id, ...otherData } = data

    let response = await fetch(new URL(`/admin/attendance/register/${id}`, BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteAttendanceRegisters: AuthenticatedServiceHandle<{ registersId: string[] }, null> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/attendance/register", BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export * from "./attendance.js"

export * from "./record.js"