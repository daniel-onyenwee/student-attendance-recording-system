import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
} from "../../../type.js"
import type { ClassAttendeeModel } from "../../../admin/index.js"

interface ClassAttendeeServiceBody {
    classAttendees: {
        studentId: string
        crashCourseId?: string
    }[]
}

interface ClassAttendeeSortByOption extends SortByOption {
    by: "name" | "regno" | "crashCourse"
}

type ClassAttendeeFilterByOption = Record<"name" | "regno" | "crashCourse", string>

interface GetClassAttendeeServiceBody extends Pagination {
    filter: Partial<ClassAttendeeFilterByOption>
    sort: Partial<ClassAttendeeSortByOption>
}

export const getLecturerClassAttendees: AuthenticatedServiceHandle<Partial<GetClassAttendeeServiceBody>, ClassAttendeeModel[]> = async ({ accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/lecturer/attendance/class-attendance/class-attendee`, BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const addLecturerClassAttendees: AuthenticatedServiceHandle<ClassAttendeeServiceBody, ClassAttendeeModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL(`/lecturer/attendance/class-attendance/class-attendee`, BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify({ ...otherData, status: "PRESENT" })
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteLecturerClassAttendees: AuthenticatedServiceHandle<{ classAttendeesId: string[] }, null> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL(`/lecturer/attendance/class-attendance/class-attendee`, BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}