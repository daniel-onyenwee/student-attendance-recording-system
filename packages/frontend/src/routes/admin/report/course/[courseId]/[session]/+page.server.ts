import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getCourseById, type CourseModel } from "@/service"

export const load = (async ({ locals, params }) => {
    if (!/^(\d{4})\/(\d{4})$/.test(params.session)) {
        throw error(404, "Not Found");
    }

    let course: CourseModel = {} as CourseModel
    let { data } = await getCourseById({ accessToken: locals.session.accessToken, id: params.courseId })

    if (data) {
        course = data
    } else {
        throw error(404, "Not Found");
    }

    return {
        course,
        academicSession: params.session
    }
}) satisfies PageServerLoad;