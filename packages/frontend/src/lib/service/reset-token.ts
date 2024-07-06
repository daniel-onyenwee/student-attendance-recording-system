import {
    AuthenticatedHeadersInit,
    BACKEND_BASE_URL,
    SECRET_KEY
} from "./utils"
import type { AuthModel, AuthenticatedServiceHandle } from "./type"

export const resetToken: AuthenticatedServiceHandle<null, AuthModel> = async (data) => {
    let response = await fetch(new URL("/auth/reset-token", BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(data.accessToken)
    })

    let responseBody = await response.json()

    if (responseBody.ok) {
        let sessionResponse = await fetch(new URL("/session", window.location.origin), {
            body: JSON.stringify(responseBody),
            method: "POST",
            headers: AuthenticatedHeadersInit(SECRET_KEY)
        })

        if (sessionResponse.status == 401) {
            return {
                ok: false,
                data: null,
                error: {
                    code: 1000,
                    message: "Session unset"
                }
            }
        }
    }

    return responseBody
}