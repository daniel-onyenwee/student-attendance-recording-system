import { env } from "$env/dynamic/public"

export const HeadersInit = (contentType: string | null = "application/json") => {
    let basicHeaders = {
        "Accept": "*/*",
        "User-Agent": "SARS Web App",
    }
    return { ...basicHeaders, ...(contentType ? { "Content-Type": "application/json" } : {}) }
}

export const AuthenticatedHeadersInit = (accessToken: string, contentType: string | null = "application/json") => {
    return {
        "Authorization": `Bearer ${accessToken}`,
        ...HeadersInit(contentType)
    }
}

export function urlFilterAttacher<FilterObjectType extends any>({ url, filter }: { url: URL; filter?: FilterObjectType; }): URL {
    for (const filterKey in (filter || {})) {
        let filterValue = Object(filter)[filterKey]

        if (filterValue) {
            url.searchParams.append(filterKey, filterValue.toString())
        }
    }

    return url
}

export function urlSortAndFilterAttacher<FilterObjectType extends any, SortObjectType extends Partial<{ by: any; ascending: boolean }> | undefined>({ url, filter, sort, count, page }: { url: URL; filter?: FilterObjectType; sort?: SortObjectType; count?: "all" | number; page?: number }): URL {
    if (count == "all") {
        url.searchParams.append("all", String())
    } else if (count && page) {
        url.searchParams.append("count", count.toString())
        url.searchParams.append("page", page.toString())
    }

    for (const filterKey in (filter || {})) {
        let filterValue = Object(filter)[filterKey]

        if (filterValue) {
            url.searchParams.append(filterKey, filterValue.toString())
        }
    }

    if (sort && sort.by && typeof sort.ascending == "boolean") {
        url.searchParams.append("by", sort.by.toString())
        url.searchParams.append("order", sort.ascending ? "asc" : "desc")
    }

    return url
}

export let BACKEND_BASE_URL = env.PUBLIC_BACKEND_BASE_URL

export let SECRET_KEY = env.PUBLIC_SECRET_KEY