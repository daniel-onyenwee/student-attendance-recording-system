import type { Level } from "../type"

interface BaseModel {
    id: string
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
}

export interface DepartmentModel extends BaseModel {
    name: string
    faculty: string
    levels: Level[]
}

export interface CourseModel extends BaseModel {
    faculty: string
    department: string
    semester: Semester
    level: Level
    code: string
    title: string
}