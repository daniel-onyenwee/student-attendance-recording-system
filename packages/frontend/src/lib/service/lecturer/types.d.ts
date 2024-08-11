import type {
    LecturerModel,
    AttendanceRegisterModel,
    AttendanceRegisterFilterByOption,
    AttendanceRegisterSortByOption,
    ClassAttendanceModel
} from "../admin/index.js"

export type ClassShape = "CIRCLE" | "SQUARE"

export type ClassSize = "EXTRA_SMALL" | "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE"

export type LecturerUserModel = { refreshToken: string } & LecturerModel

export type LecturerAttendanceRegisterModel = Omit<AttendanceRegisterModel, "decision">

export type LecturerAttendanceRegisterFilterByOption = AttendanceRegisterFilterByOption

export type LecturerAttendanceRegisterSortByOption = AttendanceRegisterSortByOption

export type LecturerClassAttendanceModel = Omit<ClassAttendanceModel, "status"> & {
    classSize: ClassSize
    classShape: ClassShape
}