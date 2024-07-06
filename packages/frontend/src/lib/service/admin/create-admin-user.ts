import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "../utils"
import type { AuthenticatedServiceHandle } from "../type"
import type { AdminUserModel } from "./types"

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