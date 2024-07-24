import type {
    Level,
    Semester,
    Gender
} from "../type"

interface BaseModel {
    id: string
    updatedAt: Date
    createdAt: Date
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

interface RecordModel extends BaseModel {
    faculty: string
    department: string
}

export interface CourseModel extends RecordModel {
    semester: Semester
    level: Level
    code: string
    title: string
}

export interface LecturerModel extends RecordModel {
    name: string
    gender: Gender
    surname: string,
    otherNames: string,
    username: string
    password: string
}