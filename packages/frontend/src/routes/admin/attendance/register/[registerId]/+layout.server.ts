import { getAttendanceRegisterById, type IClassAttendance, type AttendanceRegisterModel } from '@/service';
import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load = (async ({ locals, params }) => {

    let attendanceRegister: AttendanceRegisterModel & { classAttendances: IClassAttendance[] } = {} as AttendanceRegisterModel & { classAttendances: IClassAttendance[] }

    let { data } = await getAttendanceRegisterById({
        accessToken: locals.session.accessToken,
        id: params.registerId
    })

    if (data) {
        attendanceRegister = data
    } else {
        throw error(404, "Not Found");
    }
    return { attendanceRegister };
}) satisfies LayoutServerLoad;