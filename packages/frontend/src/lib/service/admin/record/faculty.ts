import { AuthenticatedHeadersInit, BACKEND_BASE_URL, urlSortAndFilterAttacher } from "../../utils.js"
import type { AuthenticatedServiceHandle, Pagination, SortByOption } from "../../type.d.ts"
import type { FacultyModel } from "../types.d.ts"

interface FacultyServiceBody {
    name: string
}

export interface FacultySortByOption extends SortByOption {
    by?: "name" | "updatedAt" | "createdAt"
}

export type FacultyFilterByOption = Partial<FacultyServiceBody>

interface GetFacultiesServiceBody extends Pagination {
    filter: FacultyFilterByOption
    sort: FacultySortByOption
}

export const createFaculty: AuthenticatedServiceHandle<FacultyServiceBody, FacultyModel> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/faculty", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateFaculty: AuthenticatedServiceHandle<Partial<FacultyServiceBody> & { id: string }, FacultyModel> = async (data) => {
    let { accessToken, id, ...otherData } = data

    let response = await fetch(new URL(`/admin/record/faculty/${id}`, BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getFaculties: AuthenticatedServiceHandle<Partial<GetFacultiesServiceBody>, FacultyModel[]> = async ({ accessToken, count, page, sort, filter }) => {
    let url = urlSortAndFilterAttacher<typeof filter, typeof sort>({ url: new URL("/admin/record/faculty", BACKEND_BASE_URL), filter, sort, count, page })

    let response = await fetch(url, {
        method: "GET",
        headers: AuthenticatedHeadersInit(accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const deleteFaculties: AuthenticatedServiceHandle<{ facultiesId: string[] }, null> = async (data) => {
    let { accessToken, ...otherData } = data

    let response = await fetch(new URL("/admin/record/faculty", BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify(otherData)
    })

    let responseBody = await response.json()

    return responseBody
}