import AppRoute from "./app.js"
import { PrismaClient } from "@prisma/client"

const defaultLogger = (method: string, route: string) => {
    console.log(`Visited [${method.toUpperCase()}] - ${route}`)
}

export default function initializeApp(databaseUrl: string, logger?: (method: string, route: string) => void, port: number = 8080) {
    AppRoute.set("prisma-client", new PrismaClient({ datasourceUrl: databaseUrl }))
    AppRoute.set("logger", logger)

    AppRoute.listen(port, () => console.log(`Starting server at http://localhost:${port}`))
}

export {
    defaultLogger as logger
}

initializeApp("postgresql://postgres:password@localhost:5432/sar_db?schema=public")