import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "../../utils.js"
import type { AuthenticatedServiceHandle } from "../../type.d.ts"

interface WithinStudentClassAttendanceRangeServiceBody {
    classAttendanceId: string
    latitude: number
    longitude: number
}

export const withinStudentClassAttendanceRange: AuthenticatedServiceHandle<WithinStudentClassAttendanceRangeServiceBody, null> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/student/class-attendance/within-range", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}