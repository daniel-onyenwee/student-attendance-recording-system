import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getLecturerById, type LecturerModel } from "@/service"

export const load = (async ({ locals, params }) => {
    if (!/^(\d{4})\/(\d{4})$/.test(params.session)) {
        throw error(404, "Not Found");
    }

    let lecturer: LecturerModel = {} as LecturerModel
    let { data } = await getLecturerById({ accessToken: locals.session.accessToken, id: params.lecturerId })

    if (data) {
        lecturer = data
    } else {
        throw error(404, "Not Found");
    }

    return {
        lecturer,
        academicSession: params.session
    }
}) satisfies PageServerLoad;