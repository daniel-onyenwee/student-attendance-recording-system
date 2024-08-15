import { getLecturerUser, type LecturerUserModel } from "@/service";
import type { LayoutServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load = (async ({ locals }) => {
    let user: LecturerUserModel = {} as LecturerUserModel

    let { data } = await getLecturerUser({ accessToken: locals.session.accessToken })

    if (data) {
        user = data
    } else {
        throw error(404, "Not Found");
    }

    return {
        user,
        session: locals.session
    };
}) satisfies LayoutServerLoad;