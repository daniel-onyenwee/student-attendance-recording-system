import { getAdminUser, type AdminUserModel } from "@/service";
import type { LayoutServerLoad } from "./$types";

export const load = (async ({ url, locals }) => {
    let currentPage = url.pathname

    let user: AdminUserModel = {} as AdminUserModel

    try {
        let { data } = await getAdminUser({ accessToken: locals.session.accessToken })

        if (data) {
            user = data
        } else {
            user = {} as AdminUserModel
        }
    } catch (error) {
        user = {} as AdminUserModel
    }

    return {
        pageTitle: getPageTitle(currentPage),
        breadCrumbItems: getBreadCrumbItems(currentPage),
        isMenuCollapsed: setCollapseMenuSetting(currentPage),
        currentPage,
        user,
        session: locals.session
    }
}) satisfies LayoutServerLoad

function setCollapseMenuSetting(currentPage: string) {
    let isMenuCollapsed = {
        attendances: false,
        reports: false,
        records: false,
    }

    if (currentPage.startsWith("/admin/record")) {
        isMenuCollapsed.records = true;
        isMenuCollapsed.attendances = false;
        isMenuCollapsed.reports = false;
    } else if (currentPage.startsWith("/admin/attendance")) {
        isMenuCollapsed.attendances = true;
        isMenuCollapsed.records = false;
        isMenuCollapsed.reports = false;
    } else if (currentPage.startsWith("/admin/report")) {
        isMenuCollapsed.reports = true;
        isMenuCollapsed.records = false;
        isMenuCollapsed.attendances = false;
    } else {
        isMenuCollapsed.records = false;
        isMenuCollapsed.attendances = false;
        isMenuCollapsed.reports = false;
    }

    return isMenuCollapsed
}

const getBreadCrumbItems = (currentPage: string) => {
    if (currentPage == "/admin") {
        return [
            { href: "/admin", label: "Dashboard" }
        ]
    }

    let items: { href: string, label: string }[] = []

    let paths = currentPage.split("/")

    let jointPaths = ""

    for (const path of paths) {
        if (!path) continue

        jointPaths = `${jointPaths}/${path}`
        if (path == "admin") {
            items.push({ href: "/admin", label: "dashboard" })
        } else if (path == "record") {
            items.push({ href: "##", label: "records" })
        } else if (path == "attendance") {
            items.push({ href: "##", label: "attendances" })
        } else if (path == "report") {
            items.push({ href: "##", label: "reports" })
        } else if (["department", "course", "student", "lecturer", "register"].includes(path)) {
            items.push({ href: jointPaths, label: path + "s" })
        } else if (path == "faculty") {
            items.push({ href: jointPaths, label: "faculties" })
        } else if (path == "class-attendance") {
            items.push({ href: jointPaths, label: "Class attendances" })
        } else {
            items.push({ href: jointPaths, label: path })
        }
    }

    return items
}

const getPageTitle = (currentPage: string) => {
    return currentPage == "/admin"
        ? "Dashboard"
        : currentPage.startsWith("/admin/record/faculty")
            ? "Faculties | Record"
            : currentPage.startsWith("/admin/record/department")
                ? "Departments | Record"
                : currentPage.startsWith("/admin/record/course")
                    ? "Courses | Record"
                    : currentPage.startsWith("/admin/record/lecturer")
                        ? "Lecturers | Record"
                        : currentPage.startsWith("/admin/record/student")
                            ? "Students | Record"
                            : currentPage.startsWith("/admin/report/course")
                                ? "Course | Report"
                                : currentPage.startsWith("/admin/report/lecturer")
                                    ? "Lecturer | Report"
                                    : currentPage.startsWith("/admin/report/student")
                                        ? "Student | Report"
                                        : currentPage.startsWith(
                                            "/admin/attendance/register"
                                        )
                                            ? "Registers | Attendances"
                                            : currentPage.startsWith(
                                                "/admin/attendance/class-attendance"
                                            )
                                                ? "Class Attendances | Attendance"
                                                : "Page not found"
}