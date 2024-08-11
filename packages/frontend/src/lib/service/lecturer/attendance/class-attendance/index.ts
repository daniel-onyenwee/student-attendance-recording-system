import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "../../../utils.js"
import type { AuthenticatedServiceHandle } from "../../../type.js"
import type { LecturerClassAttendanceModel, ClassShape, ClassSize } from "../../types.js"

interface LecturerClassAttendanceServiceBody {
    attendanceRegisterId: string
    date: Date
    startTime: Date
    endTime: Date
    latitude: number
    longitude: number
    classSize?: ClassSize
    classShape?: ClassShape
}

export const getLecturerClassAttendance: AuthenticatedServiceHandle<null, LecturerClassAttendanceModel> = async ({ accessToken }) => {
    let response = await fetch(new URL(`/lecturer/attendance/class-attendance/`, BACKEND_BASE_URL), {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const startLecturerClassAttendance: AuthenticatedServiceHandle<LecturerClassAttendanceServiceBody, LecturerClassAttendanceModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL(`/lecturer/attendance/class-attendance/`, BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateLecturerClassAttendance: AuthenticatedServiceHandle<Partial<Omit<LecturerClassAttendanceServiceBody, "longitude" | "latitude">>, LecturerClassAttendanceModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL(`/lecturer/attendance/class-attendance/`, BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}


export const submitLecturerClassAttendance: AuthenticatedServiceHandle<{ submittedAt: Date }, LecturerClassAttendanceModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL(`/lecturer/attendance/class-attendance/submit`, BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteLecturerClassAttendance: AuthenticatedServiceHandle<null, LecturerClassAttendanceModel> = async ({ accessToken }) => {
    let response = await fetch(new URL(`/lecturer/attendance/class-attendance`, BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
    })

    let responseBody = await response.json()

    return responseBody
}

export * from "./class-attendee.js"