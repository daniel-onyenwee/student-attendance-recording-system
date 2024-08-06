import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption
} from "../../../type.js"
import type { AttendanceRegisterStudentModel, AttendanceRegisterLecturerModel } from "../../types.js"
import type { LecturerFilterByOption, StudentFilterByOption } from "../../index.js"

export type AttendanceRegisterStudentFilterByOption = Omit<StudentFilterByOption, "password">

export interface AttendanceRegisterStudentSortByOption extends SortByOption {
    by: "name" | "gender" | "regno" | "level" | "updatedAt" | "createdAt" | "department" | "faculty"
}

export interface AttendanceRegisterLecturerSortByOption extends SortByOption {
    by: "name" | "gender" | "username" | "updatedAt" | "createdAt" | "department" | "faculty"
}

export type AttendanceRegisterLecturerFilterByOption = Omit<LecturerFilterByOption, "password">

interface GetAttendanceRegisterStudentServiceBody extends Pagination {
    filter: Partial<AttendanceRegisterStudentFilterByOption>
    sort: Partial<AttendanceRegisterStudentSortByOption>
}

interface GetAttendanceRegisterLecturerServiceBody extends Pagination {
    filter: Partial<AttendanceRegisterLecturerFilterByOption>
    sort: Partial<AttendanceRegisterLecturerSortByOption>
}

export const getAttendanceRegisterStudents: AuthenticatedServiceHandle<Partial<GetAttendanceRegisterStudentServiceBody> & { registerId: string }, AttendanceRegisterStudentModel[]> = async ({ accessToken, count, page, sort, filter, registerId }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/attendance/register/${registerId}/student`, BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const addAttendanceRegisterStudents: AuthenticatedServiceHandle<{ registerId: string, studentsId: string[] }, null> = async (data) => {
    let { accessToken, registerId, ...otherData } = data

    let response = await fetch(new URL(`/admin/attendance/register/${registerId}/student`, BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteAttendanceRegisterStudents: AuthenticatedServiceHandle<{ registerId: string, attendanceRegisterStudentsId: string[] }, null> = async (data) => {
    let { accessToken, registerId, ...otherData } = data

    let response = await fetch(new URL(`/admin/attendance/register/${registerId}/student`, BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getAttendanceRegisterLecturers: AuthenticatedServiceHandle<Partial<GetAttendanceRegisterLecturerServiceBody> & { registerId: string }, AttendanceRegisterLecturerModel[]> = async ({ accessToken, count, page, sort, filter, registerId }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/attendance/register/${registerId}/lecturer`, BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const addAttendanceRegisterLecturers: AuthenticatedServiceHandle<{ registerId: string, lecturersId: string[] }, null> = async (data) => {
    let { accessToken, registerId, ...otherData } = data

    let response = await fetch(new URL(`/admin/attendance/register/${registerId}/lecturer`, BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteAttendanceRegisterLecturers: AuthenticatedServiceHandle<{ registerId: string, attendanceRegisterLecturersId: string[] }, null> = async (data) => {
    let { accessToken, registerId, ...otherData } = data

    let response = await fetch(new URL(`/admin/attendance/register/${registerId}/lecturer`, BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}