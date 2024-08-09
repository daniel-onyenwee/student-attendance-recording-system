import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getStudentById, type StudentModel } from "@/service"

export const load = (async ({ locals, params }) => {
    if (!/^(\d{4})\/(\d{4})$/.test(params.session)) {
        throw error(404, "Not Found");
    }

    let student: StudentModel = {} as StudentModel
    let { data } = await getStudentById({ accessToken: locals.session.accessToken, id: params.studentId })

    if (data) {
        student = data
    } else {
        throw error(404, "Not Found");
    }

    return {
        student,
        academicSession: params.session
    }
}) satisfies PageServerLoad;