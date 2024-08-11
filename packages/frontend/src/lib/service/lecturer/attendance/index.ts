import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../utils.js"
import type { AuthenticatedServiceHandle, Pagination } from "../../type.js"
import type {
    LecturerAttendanceRegisterModel,
    LecturerAttendanceRegisterFilterByOption,
    LecturerAttendanceRegisterSortByOption
} from "../types.js"

interface GetLecturerAttendanceRegisterServiceBody extends Pagination {
    filter: Partial<LecturerAttendanceRegisterFilterByOption>
    sort: Partial<LecturerAttendanceRegisterSortByOption>
}

export const getLecturerAttendanceRegisters: AuthenticatedServiceHandle<Partial<GetLecturerAttendanceRegisterServiceBody>, LecturerAttendanceRegisterModel[]> = async ({ accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL("/lecturer/attendance/register", BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export * from "./class-attendance/index.js"