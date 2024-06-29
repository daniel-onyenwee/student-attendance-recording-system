export interface AuthModel {
    expireIn: number
    accessToken: string
    refreshToken: string
}

export type UserType = "ADMIN" | "STUDENT" | "LECTURER"

type ServiceHandle<ServiceBody, Data> = (data: ServiceBody) => ServiceData<Data> | Promise<ServiceData<Data>>

type AuthenticatedServiceHandle<ServiceBody, Data> = (data: ServiceBody & { accessToken: string }) => ServiceData<Data> | Promise<ServiceData<Data>>

interface ServiceError {
    code: number
    message: string
}

export interface ServiceData<T> {
    ok: false
    error: ServiceError | null
    data: T | null
}