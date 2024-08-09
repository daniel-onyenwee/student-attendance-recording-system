import {
    AuthenticatedHeadersInit,
    BACKEND_BASE_URL,
    urlSortAndFilterAttacher
} from "../../utils.js"
import type { AuthenticatedServiceHandle, Pagination, SortByOption } from "../../type.d.ts"
import type { StudentReportModel } from "../types.d.ts"

export interface StudentReportSortByOption extends SortByOption {
    by: "courseTitle" | "courseCode" | "semester"
}

export type StudentReportFilterByOption = Record<"courseTitle" | "courseCode" | "semester", string>

interface GenerateStudentReportServiceBody extends Pagination {
    filter: StudentReportFilterByOption
    sort: StudentReportSortByOption
}

export const generateStudentReport: AuthenticatedServiceHandle<Partial<GenerateStudentReportServiceBody> & { studentId: string, session: string }, StudentReportModel> =
    async ({ studentId, session, accessToken, count, page, sort, filter }) => {
        let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/report/student/${studentId}/${session}`, BACKEND_BASE_URL), filter, sort, count, page })

        let response = await fetch(url, {
            method: "GET",
            headers: AuthenticatedHeadersInit(accessToken)
        })

        let responseBody = await response.json()

        return responseBody
    }

export const generateStudentReportDownloadLink = ({ studentId, session, count, page, sort, filter }: Partial<GenerateStudentReportServiceBody> & { studentId: string, session: string }): string => {
    return urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/report/student/download/${studentId}/${session}`, BACKEND_BASE_URL), filter, sort, count, page }).toString()
}