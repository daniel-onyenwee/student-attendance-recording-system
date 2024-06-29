import type { AuthModel } from "@/service"
import { redirect, type Handle } from "@sveltejs/kit"

export const handle: Handle = async ({ resolve, event }) => {
  let unauthorizedRoutes = ["/login", "/session"]

  if (unauthorizedRoutes.some(route => event.url.pathname.startsWith(route))) {
    return await resolve(event)
  }

  let session = event.cookies.get("session")

  if (!session) {
    redirect(307, "/login")
  }

  let sessionData = JSON.parse(session)

  if (sessionData.expiresIn <= Date.now()) {
    redirect(307, "/login")
  }

  event.locals = {
    session: sessionData as AuthModel
  }

  return await resolve(event)
}
