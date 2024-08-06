import type { LayoutServerLoad } from './$types';
import { getClassAttendanceById, type ClassAttendanceModel } from "@/service"
import { error } from '@sveltejs/kit';

export const load = (async ({ locals, params }) => {
    let classAttendance: ClassAttendanceModel = {} as ClassAttendanceModel

    let { data } = await getClassAttendanceById({
        accessToken: locals.session.accessToken,
        id: params.classAttendanceId
    })

    if (data) {
        classAttendance = data
    } else {
        throw error(404, "Not Found");
    }
    return { classAttendance };
}) satisfies LayoutServerLoad;