import type { Level } from "../type"

interface BaseModel {
    updatedAt: Date
    createdAt: Date
    metadata: { [name: string]: any }
}

export interface AdminUserModel extends BaseModel {
    id: string
    refreshToken: string
    password: string
    username: string
}

export interface FacultyModel extends BaseModel {
    name: string
    id: string
}

export interface DepartmentModel extends BaseModel {
    name: string
    id: string
    faculty: string
    levels: Level[]
}
