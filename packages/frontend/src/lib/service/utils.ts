import { env } from "$env/dynamic/public"

export const HeadersInit = () => {
    return {
        "Accept": "*/*",
        "User-Agent": "SARS Web App",
        "Content-Type": "application/json"
    }
}

export const AuthenticatedHeadersInit = (accessToken: string) => {
    return {
        "Authorization": `Bearer ${accessToken}`,
        ...HeadersInit()
    }
}

export let BACKEND_BASE_URL = env.PUBLIC_BACKEND_BASE_URL

export let SECRET_KEY = env.PUBLIC_SECRET_KEY