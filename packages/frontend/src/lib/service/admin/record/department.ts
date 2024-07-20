import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../utils.js"
import type {
    AuthenticatedServiceHandle,
    Level,
    Pagination,
    SortByOption
} from "../../type.d.ts"
import type { DepartmentModel } from "../types.d.ts"

interface DepartmentServiceBody {
    name: string
    facultyId: string
    levels: Level[]
}

export interface DepartmentSortByOption extends SortByOption {
    by: "name" | "faculty" | "updatedAt" | "createdAt"
}

export interface DepartmentFilterByOption {
    name: string
    faculty: string
}

interface GetDepartmentsServiceBody extends Pagination {
    filter: Partial<DepartmentFilterByOption>
    sort: Partial<DepartmentSortByOption>
}

export const getDepartments: AuthenticatedServiceHandle<Partial<GetDepartmentsServiceBody>, DepartmentModel[]> = async ({ accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL("/admin/record/department", BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const createDepartment: AuthenticatedServiceHandle<DepartmentServiceBody, DepartmentModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/department", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateDepartment: AuthenticatedServiceHandle<Partial<DepartmentServiceBody> & { id: string }, DepartmentModel> = async (data) => {
    let { accessToken, id, ...otherData } = data

    let response = await fetch(new URL(`/admin/record/department/${id}`, BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}


export const deleteDepartments: AuthenticatedServiceHandle<{ departmentsId: string[] }, null> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/department", BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}