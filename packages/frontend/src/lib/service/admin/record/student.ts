import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Pagination,
    SortByOption,
    Gender,
    Level
} from "../../type.d.ts"
import type { StudentModel } from "../types.d.ts"

interface StudentServiceBody {
    surname: string
    otherNames: string
    gender: Gender
    regno: string
    password: string
    departmentId: string
    level: Level
}

export interface StudentSortByOption extends SortByOption {
    by: "name" | "gender" | "regno" | "level" | "password" | "updatedAt" | "createdAt" | "department" | "faculty"
}

export interface StudentFilterByOption {
    name: string
    faculty: string
    level: string
    department: string
    gender: string
    password: string
    regno: string
}

interface GetStudentsServiceBody extends Pagination {
    filter: Partial<StudentFilterByOption>
    sort: Partial<StudentSortByOption>
}

export const getStudents: AuthenticatedServiceHandle<Partial<GetStudentsServiceBody>, StudentModel[]> = async ({ accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL("/admin/record/student", BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createStudent: AuthenticatedServiceHandle<StudentServiceBody, StudentModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/student", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateStudent: AuthenticatedServiceHandle<Partial<StudentServiceBody> & { id: string }, StudentModel> = async (data) => {
    let { accessToken, id, ...otherData } = data

    let response = await fetch(new URL(`/admin/record/student/${id}`, BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const uploadStudentFace: AuthenticatedServiceHandle<{ faceImage: Blob, id: string }, { faceImage: string }> = async (data) => {
    let { accessToken, faceImage, id } = data

    let bodyContent = new FormData()

    bodyContent.append("faceImage", faceImage)

    let response = await fetch(new URL(`/admin/record/student/${id}/face-image`, BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken, null),
        body: bodyContent
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteStudents: AuthenticatedServiceHandle<{ studentsId: string[] }, null> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/student", BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}