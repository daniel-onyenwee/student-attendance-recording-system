import type { PageServerLoad } from './$types';
import { getCourses, type CourseModel } from "@/service";

export const load = (async ({ locals }) => {
    let { data } = await getCourses({ accessToken: locals.session.accessToken, count: "all" })

    if (data) {
        return {
            courses: data
        }
    } else {
        return {
            courses: [] as CourseModel[]
        };
    }


}) satisfies PageServerLoad;