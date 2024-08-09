import type { PageServerLoad } from './$types';
import { getLecturers, type LecturerModel } from "@/service";

export const load = (async ({ locals }) => {
    let { data } = await getLecturers({ accessToken: locals.session.accessToken, count: "all" })

    if (data) {
        return {
            lecturers: data
        }
    } else {
        return {
            lecturers: [] as LecturerModel[]
        };
    }


}) satisfies PageServerLoad;