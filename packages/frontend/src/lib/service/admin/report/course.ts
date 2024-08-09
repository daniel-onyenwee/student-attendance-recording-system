import {
    AuthenticatedHeadersInit,
    BACKEND_BASE_URL,
    urlSortAndFilterAttacher
} from "../../utils.js"
import type { AuthenticatedServiceHandle, Pagination, SortByOption } from "../../type.d.ts"
import type { CourseReportModel } from "../types.d.ts"

export interface CourseReportSortByOption extends SortByOption {
    by: "name" | "regno"
}

export type CourseReportFilterByOption = Record<"name" | "regno", string>

interface GenerateCourseReportServiceBody extends Pagination {
    filter: CourseReportFilterByOption
    sort: CourseReportSortByOption
}

export const generateCourseReport: AuthenticatedServiceHandle<Partial<GenerateCourseReportServiceBody> & { courseId: string, session: string }, CourseReportModel> =
    async ({ courseId, session, accessToken, count, page, sort, filter }) => {
        let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/report/course/${courseId}/${session}`, BACKEND_BASE_URL), filter, sort, count, page })

        let response = await fetch(url, {
            method: "GET",
            headers: AuthenticatedHeadersInit(accessToken)
        })

        let responseBody = await response.json()

        return responseBody
    }

export const generateCourseReportDownloadLink = ({ courseId, session, count, page, sort, filter }: Partial<GenerateCourseReportServiceBody> & { courseId: string, session: string }): string => {
    return urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL(`/admin/report/course/download/${courseId}/${session}`, BACKEND_BASE_URL), filter, sort, count, page }).toString()
}