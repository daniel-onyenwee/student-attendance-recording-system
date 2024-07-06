export interface AuthModel {
    expireIn: number
    accessToken: string
    refreshToken: string
}

export type UserType = "ADMIN" | "STUDENT" | "LECTURER"

type ServiceHandle<ServiceBody, ServiceReturnedData> = ServiceBody extends null ?
    () => ServiceData<ServiceReturnedData> | Promise<ServiceData<ServiceReturnedData>> :
    (data: ServiceBody) => ServiceData<ServiceReturnedData> | Promise<ServiceData<ServiceReturnedData>>

type AuthenticatedServiceHandle<ServiceBody, ServiceReturnedData> = ServiceBody extends null ?
    ({ accessToken: string }) => ServiceData<ServiceReturnedData> | Promise<ServiceData<ServiceReturnedData>> :
    (data: ServiceBody & { accessToken: string }) => ServiceData<ServiceReturnedData> | Promise<ServiceData<ServiceReturnedData>>

interface ServiceError {
    code: number
    message: string
}

export interface ServiceData<T> {
    ok: false
    error: ServiceError | null
    data: T | null
}