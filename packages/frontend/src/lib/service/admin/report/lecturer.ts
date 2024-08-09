import {
    AuthenticatedHeadersInit,
    BACKEND_BASE_URL,
    urlSortAndFilterAttacher
} from "../../utils.js"
import type { AuthenticatedServiceHandle, Pagination, SortByOption } from "../../type.d.ts"
import type { LecturerReportModel } from "../types.d.ts"

export interface LecturerReportSortByOption extends SortByOption {
    by: "courseTitle" | "courseCode" | "semester"
}

export type LecturerReportFilterByOption = Record<"courseTitle" | "courseCode" | "semester", string>

interface GenerateLecturerReportServiceBody extends Pagination {
    filter: LecturerReportFilterByOption
    sort: LecturerReportSortByOption
}

export const generateLecturerReport: AuthenticatedServiceHandle<Partial<GenerateLecturerReportServiceBody> & { lecturerId: string, session: string }, LecturerReportModel> =
    async ({ lecturerId, session, accessToken, count, page, sort, filter }) => {
        let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/report/lecturer/${lecturerId}/${session}`, BACKEND_BASE_URL), filter, sort, count, page })

        let response = await fetch(url, {
            method: "GET",
            headers: AuthenticatedHeadersInit(accessToken)
        })

        let responseBody = await response.json()

        return responseBody
    }

export const generateLecturerReportDownloadLink = ({ lecturerId, session, count, page, sort, filter }: Partial<GenerateLecturerReportServiceBody> & { lecturerId: string, session: string }): string => {
    return urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/report/lecturer/download/${lecturerId}/${session}`, BACKEND_BASE_URL), filter, sort, count, page }).toString()
}