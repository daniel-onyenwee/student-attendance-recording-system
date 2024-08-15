import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "../utils.js"
import type { AuthenticatedServiceHandle } from "../type.d.ts"
import type { StudentUserModel } from "./types.d.ts"

export const getStudentUser: AuthenticatedServiceHandle<null, StudentUserModel> = async (data) => {
    let response = await fetch(new URL("/student", BACKEND_BASE_URL), {
        method: "GET",
        headers: AuthenticatedHeadersInit(data.accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateStudentUser: AuthenticatedServiceHandle<{ password: string }, StudentUserModel> = async ({ accessToken, password }) => {
    let response = await fetch(new URL("/student", BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify({
            password
        })
    })

    let responseBody = await response.json()

    return responseBody
}


export type * from "./types.d.ts"
export * from "./verify-face.js"
export * from "./class-attendance/index.js"