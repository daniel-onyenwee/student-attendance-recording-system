import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getLecturerClassAttendance } from '@/service';

export const load = (async ({ parent }) => {
    let { session } = await parent()

    let { data: classAttendance } = await getLecturerClassAttendance({ accessToken: session.accessToken })

    if (classAttendance) {
        redirect(307, "/lecturer/class-attendance")
    }

    return {};
}) satisfies PageServerLoad;