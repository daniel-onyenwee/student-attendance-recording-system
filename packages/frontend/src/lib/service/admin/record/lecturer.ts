import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    Gender
} from "../../type.d.ts"
import type { LecturerModel } from "../types.d.ts"

interface LecturerServiceBody {
    surname: string
    otherNames: string
    gender: Gender
    username: string
    password: string
    departmentId: string
}

export interface LecturerSortByOption extends SortByOption {
    by: "name" | "gender" | "username" | "password" | "updatedAt" | "createdAt" | "department" | "faculty"
}

export interface LecturerFilterByOption {
    name: string
    faculty: string
    department: string
    gender: string
    password: string
    username: string
}

interface GetLecturersServiceBody extends Pagination {
    filter: Partial<LecturerFilterByOption>
    sort: Partial<LecturerSortByOption>
}

export const getLecturers: AuthenticatedServiceHandle<Partial<GetLecturersServiceBody>, LecturerModel[]> = async ({ accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL("/admin/record/lecturer", BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createLecturer: AuthenticatedServiceHandle<LecturerServiceBody, LecturerModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/lecturer", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateLecturer: AuthenticatedServiceHandle<Partial<LecturerServiceBody> & { id: string }, LecturerModel> = async (data) => {
    let { accessToken, id, ...otherData } = data

    let response = await fetch(new URL(`/admin/record/lecturer/${id}`, BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteLecturers: AuthenticatedServiceHandle<{ lecturersId: string[] }, null> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/lecturer", BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}