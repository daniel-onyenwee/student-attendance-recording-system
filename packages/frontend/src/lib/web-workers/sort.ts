import type {
    FacultyModel,
    FacultySortByOption,
    DepartmentModel,
    DepartmentSortByOption
} from "@/service"
import { sort } from "fast-sort"

type SortMessageEventMode = "REQUEST" | "RESPONSE"

type SortMessageEvent = {
    mode: SortMessageEventMode
    type: "FACULTY"
    payload: FacultyModel[]
    sortOptions: FacultySortByOption
} | {
    mode: SortMessageEventMode
    type: "DEPARTMENT"
    payload: DepartmentModel[]
    sortOptions: DepartmentSortByOption
}

addEventListener('message', (e: MessageEvent<SortMessageEvent>) => {
    const { type, sortOptions, payload, mode } = e.data


    if (type == "FACULTY" && mode == "REQUEST") {
        let result = payload
        if (sortOptions.by == "name") {
            result = sortOptions.ascending
                ? sort(payload).asc((i) => i.name)
                : sort(payload).desc((i) => i.name);
        } else if (sortOptions.by == "createdAt") {
            result = sortOptions.ascending
                ? sort(payload).asc((i) => i.createdAt)
                : sort(payload).desc((i) => i.createdAt);
        } else if (sortOptions.by == "updatedAt") {
            result = sortOptions.ascending
                ? sort(payload).asc((i) => i.updatedAt)
                : sort(payload).desc((i) => i.updatedAt);
        }

        postMessage({ type: "FACULTY", mode: "RESPONSE", payload: result })
    } else if (type == "DEPARTMENT" && mode == "REQUEST") {
        let result = payload
        if (sortOptions.by == "name") {
            result = sortOptions.ascending
                ? sort(payload).asc((i) => i.name)
                : sort(payload).desc((i) => i.name);
        } else if (sortOptions.by == "createdAt") {
            result = sortOptions.ascending
                ? sort(payload).asc((i) => i.createdAt)
                : sort(payload).desc((i) => i.createdAt);
        } else if (sortOptions.by == "updatedAt") {
            result = sortOptions.ascending
                ? sort(payload).asc((i) => i.updatedAt)
                : sort(payload).desc((i) => i.updatedAt);
        } else if (sortOptions.by == "faculty") {
            result = sortOptions.ascending
                ? sort(payload).asc((i) => i.faculty)
                : sort(payload).desc((i) => i.faculty);
        }

        postMessage({ type: "DEPARTMENT", mode: "RESPONSE", payload: result })
    }
})