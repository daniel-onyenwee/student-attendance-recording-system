import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption
} from "../../../type.js"
import type { ClassAttendeeModel } from "../../types.js"

interface ClassAttendeeServiceBody {
    classAttendees: {
        studentId: string
        crashCourseId?: string
    }[]
}

export interface ClassAttendeeSortByOption extends SortByOption {
    by: "name" | "regno" | "crashCourse"
}

export type ClassAttendeeFilterByOption = Record<"name" | "regno" | "crashCourse", string>

interface GetClassAttendeeServiceBody extends Pagination {
    filter: Partial<ClassAttendeeFilterByOption>
    sort: Partial<ClassAttendeeSortByOption>
}

export const getClassAttendees: AuthenticatedServiceHandle<Partial<GetClassAttendeeServiceBody> & { classAttendanceId: string }, ClassAttendeeModel[]> = async ({ accessToken, count, page, sort, filter, classAttendanceId }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/attendance/class-attendance/${classAttendanceId}/class-attendee`, BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const addClassAttendees: AuthenticatedServiceHandle<ClassAttendeeServiceBody & { classAttendanceId: string }, ClassAttendeeModel> = async (data) => {
    let { accessToken, classAttendanceId, ...otherData } = data

    let response = await fetch(new URL(`/admin/attendance/class-attendance/${classAttendanceId}/class-attendee`, BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify({ ...otherData, status: "PRESENT" })
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteClassAttendees: AuthenticatedServiceHandle<{ classAttendanceId: string, classAttendeesId: string[] }, null> = async (data) => {
    let { accessToken, classAttendanceId, ...otherData } = data

    let response = await fetch(new URL(`/admin/attendance/class-attendance/${classAttendanceId}/class-attendee`, BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}