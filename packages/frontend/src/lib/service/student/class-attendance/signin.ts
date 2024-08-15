import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "../../utils.js"
import type { AuthenticatedServiceHandle } from "../../type.d.ts"
import type { StudentClassAttendanceModel } from "../types.d.ts"

interface SigninStudentClassAttendanceServiceBody {
    classAttendanceId: string
    currentTimestamp: string
    latitude: number
    longitude: number
    crashCourseId?: string
}

export const signinStudentClassAttendance: AuthenticatedServiceHandle<SigninStudentClassAttendanceServiceBody, StudentClassAttendanceModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/student/class-attendance/signin", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}