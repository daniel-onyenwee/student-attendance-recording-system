import {
    AuthenticatedHeadersInit,
    BACKEND_BASE_URL,
    urlSortAndFilterAttacher
} from "../../utils.js"
import type { AuthenticatedServiceHandle, Pagination } from "../../type.d.ts"
import type {
    StudentClassAttendanceModel,
    StudentClassAttendanceFilterByOption,
    StudentClassAttendanceSortByOption
} from "../types.d.ts"

interface GetStudentClassAttendeeServiceBody extends Pagination {
    filter: Partial<StudentClassAttendanceFilterByOption>
    sort: Partial<StudentClassAttendanceSortByOption>
}

export const getStudentClassAttendances: AuthenticatedServiceHandle<Partial<GetStudentClassAttendeeServiceBody> & { currentTimestamp: string, latitude: number, longitude: number }, StudentClassAttendanceModel[]> = async ({ accessToken, count, page, sort, filter, currentTimestamp, latitude, longitude }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/student/class-attendance`, BACKEND_BASE_URL), filter, sort, count, page })

    url.searchParams.set("currentTimestamp", currentTimestamp)
    url.searchParams.set("latitude", latitude.toString())
    url.searchParams.set("longitude", longitude.toString())

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })


    let responseBody = await response.json()

    return responseBody
}

export const signoutStudentClassAttendance: AuthenticatedServiceHandle<null, StudentClassAttendanceModel> = async ({ accessToken }) => {
    let response = await fetch(new URL("/student/class-attendance/signout", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
    })

    let responseBody = await response.json()

    return responseBody
}

export const signedStudentClassAttendance: AuthenticatedServiceHandle<null, StudentClassAttendanceModel> = async ({ accessToken }) => {
    let response = await fetch(new URL("/student/class-attendance/signed", BACKEND_BASE_URL), {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken),
    })

    let responseBody = await response.json()

    return responseBody
}

export * from "./within-range.js"
export * from "./signin.js"