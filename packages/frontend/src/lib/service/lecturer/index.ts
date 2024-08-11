import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "../utils.js"
import type { AuthenticatedServiceHandle } from "../type.d.ts"
import type { LecturerUserModel } from "./types.d.ts"

export const getLecturerUser: AuthenticatedServiceHandle<null, LecturerUserModel> = async (data) => {
    let response = await fetch(new URL("/lecturer", BACKEND_BASE_URL), {
        method: "GET",
        headers: AuthenticatedHeadersInit(data.accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const updateLecturerUser: AuthenticatedServiceHandle<{ password: string, username: string }, LecturerUserModel> = async ({ accessToken, username, password }) => {
    let response = await fetch(new URL("/lecturer", BACKEND_BASE_URL), {
        method: "PATCH",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify({
            username,
            password
        })
    })

    let responseBody = await response.json()

    return responseBody
}


export type * from "./types.d.ts"
export * from "./attendance/index.js"