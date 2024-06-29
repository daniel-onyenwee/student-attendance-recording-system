import type { RequestHandler } from './$types'
import { checkUser } from "@/service"
import { redirect } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.session) {
        redirect(307, "/login")
    }

    let user = await checkUser({ accessToken: locals.session.accessToken })

    if (user.data) {
        if (user.data.type == "ADMIN") {
            redirect(307, "/admin")
        } else if (user.data.type == "LECTURER") {
            redirect(307, "/lecturer")
        } else if (user.data.type == "STUDENT") {
            redirect(307, "/student")
        }
    }

    redirect(307, "/login")
}