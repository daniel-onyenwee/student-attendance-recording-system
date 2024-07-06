import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "../utils"
import type { AuthenticatedServiceHandle } from "../type"
import type { AdminUserModel } from "./types"

export const deleteAdminUser: AuthenticatedServiceHandle<null, AdminUserModel> = async (data) => {
    let response = await fetch(new URL("/admin", BACKEND_BASE_URL), {
        method: "DELETE",
        headers: AuthenticatedHeadersInit(data.accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}