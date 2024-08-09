import type { PageServerLoad } from './$types';
import { getStudents, type StudentModel } from "@/service";

export const load = (async ({ locals }) => {
    let { data } = await getStudents({ accessToken: locals.session.accessToken, count: "all" })

    if (data) {
        return {
            students: data
        }
    } else {
        return {
            students: [] as StudentModel[]
        };
    }


}) satisfies PageServerLoad;