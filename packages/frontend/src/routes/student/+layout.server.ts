import { getStudentUser, signedStudentClassAttendance, type StudentUserModel } from "@/service";
import type { LayoutServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load = (async ({ locals }) => {
    let user: StudentUserModel = {} as StudentUserModel

    let { data } = await getStudentUser({ accessToken: locals.session.accessToken })

    if (data) {
        user = data
    } else {
        throw error(404, "Not Found");
    }

    let { data: signedClassAttendance } = await signedStudentClassAttendance({ accessToken: locals.session.accessToken })

    return {
        user,
        session: locals.session,
        signedClassAttendance
    };
}) satisfies LayoutServerLoad;