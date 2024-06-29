import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "./utils"
import type { AuthenticatedServiceHandle, UserType } from "./type"

export interface UserModel {
    refreshToken: string,
    id: string,
    type: UserType
}

export const checkUser: AuthenticatedServiceHandle<{}, UserModel> = async (data) => {
    let response = await fetch(new URL("/user", BACKEND_BASE_URL), {
        method: "GET",
        headers: AuthenticatedHeadersInit(data.accessToken)
    })

    let responseBody = await response.json()

    return responseBody
}