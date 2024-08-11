import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "../utils.js"
import type { AuthenticatedServiceHandle } from "../type.d.ts"
import type { AdminUserModel } from "./types.d.ts"

export const createAdminUser: AuthenticatedServiceHandle<{ password: string, username: string }, AdminUserModel> = async ({ accessToken, username, password }) => {
    let response = await fetch(new URL("/admin", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken),
        body: JSON.stringify({
            username,
            password
        })
    })


    let responseBody = await response.json()

    return responseBody
}

export const updateAdminUser: AuthenticatedServiceHandle<{ password: string, username: string }, AdminUserModel> = async ({ accessToken, username, password }) => {
    let response = await fetch(new URL("/admin", BACKEND_BASE_URL), {
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

export const deleteAdminUser: AuthenticatedServiceHandle<null, AdminUserModel> = async (data) => {
    let response = await fetch(new URL("/admin", BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(data.accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export const getAdminUser: AuthenticatedServiceHandle<null, AdminUserModel> = async (data) => {
    let response = await fetch(new URL("/admin", BACKEND_BASE_URL), {
        method: "GET",
        headers: AuthenticatedHeadersInit(data.accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}

export type * from "./types.d.ts"
export * from "./record/index.js"
export * from "./attendance/index.js"
export * from "./report/index.js"