import {
    AuthenticatedHeadersInit,
    BACKEND_BASE_URL,
    HeadersInit,
    SECRET_KEY
} from "./utils.js"
import type { AuthModel, AuthenticatedServiceHandle, ServiceHandle } from "./type.d.ts"

export interface LoginServiceBody {
    type: "ADMIN" | "STUDENT" | "LECTURER"
    username: string
    password: string
}

export const login: ServiceHandle<LoginServiceBody, AuthModel> = async (data) => {
    let response = await fetch(new URL("/auth/login", BACKEND_BASE_URL), {
        body: JSON.stringify(data),
        method: "POST",
        headers: HeadersInit()
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