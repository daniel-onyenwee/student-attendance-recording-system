export interface AuthModel {
    expireIn: number
    accessToken: string
    refreshToken: string
}

export interface Pagination {
    page?: number
    count?: number | "all"
}

export interface SortByOption {
    ascending?: boolean
}

export type UserType = "ADMIN" | "STUDENT" | "LECTURER"

type ServiceHandle<ServiceBody, ServiceReturnedData> = ServiceBody extends null ?
    () => Promise<ServiceData<ServiceReturnedData>> :
    (data: ServiceBody) => Promise<ServiceData<ServiceReturnedData>>

type AuthenticatedServiceHandle<ServiceBody, ServiceReturnedData> = ServiceBody extends null ?
    ({ accessToken: string }) => Promise<ServiceData<ServiceReturnedData>> :
    (data: ServiceBody & { accessToken: string }) => Promise<ServiceData<ServiceReturnedData>>

interface ServiceError {
    code: number
    message: string
}

export interface ServiceData<T> {
    ok: false
    error: ServiceError | null
    data: T | null
}

type LevelNumber = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000

export type Level = `L_${LevelNumber}`

export type Semester = "FIRST" | "SECOND"

export type Gender = "MALE" | "FEMALE"