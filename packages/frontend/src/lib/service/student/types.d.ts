import type {
    StudentModel,
    ClassAttendanceModel,
    ClassAttendanceFilterByOption,
    ClassAttendanceSortByOption,
} from "../admin/index.js"

import { SortByOption } from "../type.d.ts"

export type StudentUserModel = { refreshToken: string } & StudentModel

export type StudentClassAttendanceModel = Omit<ClassAttendanceModel, "status" | "submittedAt" | "lecturerUsername">

export interface StudentClassAttendanceSortByOption extends SortByOption {
    by: keyof Omit<StudentClassAttendanceModel, "id" | "date" | "startTime" | "endTime">
}

export type StudentClassAttendanceFilterByOption = Record<keyof Omit<StudentClassAttendanceModel, "id" | "date" | "startTime" | "endTime" | "createdAt" | "updatedAt">, string>