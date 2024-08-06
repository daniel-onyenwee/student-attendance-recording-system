import {
    AuthenticatedHeadersInit,
    BACKEND_BASE_URL,
    urlFilterAttacher,
    urlSortAndFilterAttacher
} from "../../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption
} from "../../../type.js"
import type { ClassAttendanceModel } from "../../types.js"

interface ClassAttendanceServiceBody {
    attendanceRegisterId: string
    attendanceRegisterLecturerId: string
    date: Date
    startTime: Date
    endTime: Date
}

export interface ClassAttendanceSortByOption extends SortByOption {
    by: "courseTitle" | "courseCode" | "session" | "semester" | "department" | "faculty" | "level" | "date" | "startTime" | "status" | "endTime" | "updatedAt" | "createdAt" | "lecturerName"
}

export interface ClassAttendanceFilterByOption {
    level: string
    faculty: string
    date: string
    lecturerName: string
    status: string
    endTime: string
    startTime: string
    department: string
    courseTitle: string
    semester: string
    session: string
    courseCode: string
}

interface GetClassAttendanceServiceBody extends Pagination {
    filter: Partial<ClassAttendanceFilterByOption>
    sort: Partial<ClassAttendanceSortByOption>
}

export const getClassAttendanceById: AuthenticatedServiceHandle<{ id: string }, ClassAttendanceModel> = async ({ accessToken, id }) => {
    let response = await fetch(new URL(`/admin/attendance/class-attendance/${id}`, BACKEND_BASE_URL), {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getClassAttendances: AuthenticatedServiceHandle<Partial<GetClassAttendanceServiceBody>, ClassAttendanceModel[]> = async ({ accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL("/admin/attendance/class-attendance", BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const statsClassAttendances: AuthenticatedServiceHandle<Partial<{ filter: Partial<ClassAttendanceFilterByOption> }>, { count: number }> = async ({ accessToken, filter }) => {
    let url = urlFilterAttacher<typeof filter>({ url: new URL("/admin/stats/attendance/class-attendance", BACKEND_BASE_URL), filter })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}


export const createClassAttendance: AuthenticatedServiceHandle<ClassAttendanceServiceBody, ClassAttendanceModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/attendance/class-attendance", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateClassAttendance: AuthenticatedServiceHandle<Partial<ClassAttendanceServiceBody> & { id: string }, ClassAttendanceModel> = async (data) => {
    let { accessToken, id, ...otherData } = data

    let response = await fetch(new URL(`/admin/attendance/class-attendance/${id}`, BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const acceptClassAttendance: AuthenticatedServiceHandle<{ id: string }, ClassAttendanceModel> = async (data) => {
    let { accessToken, id } = data

    let response = await fetch(new URL(`/admin/attendance/class-attendance/${id}/accept`, BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteClassAttendances: AuthenticatedServiceHandle<{ classAttendancesId: string[] }, null> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/attendance/class-attendance", BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export * from "./class-attendee.js"