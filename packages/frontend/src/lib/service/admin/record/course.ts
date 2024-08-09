import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Level,
    Semester,
    Pagination,
    SortByOption
} from "../../type.d.ts"
import type { CourseModel } from "../types.d.ts"

interface CourseServiceBody {
    title: string
    code: string
    level: Level
    semester: Semester
    departmentId: string
}

export interface CourseSortByOption extends SortByOption {
    by: "title" | "code" | "semester" | "updatedAt" | "createdAt" | "department" | "faculty" | "level"
}

export interface CourseFilterByOption {
    level: string
    faculty: string
    department: string
    title: string
    semester: string
    code: string
}

interface GetCoursesServiceBody extends Pagination {
    filter: Partial<CourseFilterByOption>
    sort: Partial<CourseSortByOption>
}

export const getCourses: AuthenticatedServiceHandle<Partial<GetCoursesServiceBody>, CourseModel[]> = async ({ accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL("/admin/record/course", BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getCourseById: AuthenticatedServiceHandle<{ id: string }, CourseModel> = async ({ accessToken, id }) => {
    let response = await fetch(new URL(`/admin/record/course/${id}`, BACKEND_BASE_URL), {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createCourse: AuthenticatedServiceHandle<CourseServiceBody, CourseModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/course", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateCourse: AuthenticatedServiceHandle<Partial<CourseServiceBody> & { id: string }, CourseModel> = async (data) => {
    let { accessToken, id, ...otherData } = data

    let response = await fetch(new URL(`/admin/record/course/${id}`, BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteCourses: AuthenticatedServiceHandle<{ coursesId: string[] }, null> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/course", BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}