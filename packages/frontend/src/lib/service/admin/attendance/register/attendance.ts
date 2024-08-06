import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption
} from "../../../type.js"
import type { AttendanceRegisterAttendanceModel, ClassAttendeeModel } from "../../types.js"

interface AttendanceRegisterAttendanceServiceBody {
    classAttendanceId: string
    attendanceRegisterStudentId: string
    status: "PRESENT" | "ABSENT"
}

export interface AttendanceRegisterAttendanceSortByOption extends SortByOption {
    by: "name" | "regno"
}

export type AttendanceRegisterAttendanceFilterByOption = Record<"name" | "regno", string>

interface GetAttendanceRegisterAttendanceServiceBody extends Pagination {
    filter: Partial<AttendanceRegisterAttendanceFilterByOption>
    sort: Partial<AttendanceRegisterAttendanceSortByOption>
}

export const getAttendanceRegisterAttendances: AuthenticatedServiceHandle<Partial<GetAttendanceRegisterAttendanceServiceBody> & { registerId: string }, AttendanceRegisterAttendanceModel[]> = async ({ accessToken, count, page, sort, filter, registerId }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/attendance/register/${registerId}/attendance`, BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateAttendanceRegisterAttendance: AuthenticatedServiceHandle<AttendanceRegisterAttendanceServiceBody & { registerId: string }, Omit<ClassAttendeeModel, "status" | "crashCourse">> = async (data) => {
    let { accessToken, registerId, ...otherData } = data

    let response = await fetch(new URL(`/admin/attendance/register/${registerId}/attendance`, BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}