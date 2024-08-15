import { AuthenticatedHeadersInit, BACKEND_BASE_URL } from "../utils.js"
import type { AuthenticatedServiceHandle } from "../type.d.ts"

export const verifyFace: AuthenticatedServiceHandle<{ faceImage: Blob }, null> = async (data) => {
    let { accessToken, faceImage } = data

    let bodyContent = new FormData()

    bodyContent.append("faceImage", faceImage)

    let response = await fetch(new URL(`/student/verify-face`, BACKEND_BASE_URL), {
        method: "POST",
        headers: AuthenticatedHeadersInit(accessToken, null),
        body: bodyContent
    })

    let responseBody = await response.json()

    return responseBody
}