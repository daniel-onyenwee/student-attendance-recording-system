import { AuthenticatedHeadersInit, SECRET_KEY } from "./utils.js"
import type { ServiceHandle, AuthModel } from "./type.d.ts"
import { resetToken } from "./auth.js"

export const getSession: ServiceHandle<null, AuthModel> = async () => {
    let response = await fetch(new URL("/session", window.location.origin), {
        method: "GET",
        headers: AuthenticatedHeadersInit(SECRET_KEY)
    })

    let responseBody = await response.json()

    if (response.status == 401) {
        return {
            data: null,
            ok: false,
            error: {
                code: 1002,
                message: "Unauthorized access"
            }
        }
    }

    if (responseBody.error) {
        return responseBody
    }


    if (responseBody.data && responseBody.data.expiresIn <= Date.now()) {
        return await resetToken({ accessToken: responseBody.data.refreshToken })
    }

    return responseBody
}