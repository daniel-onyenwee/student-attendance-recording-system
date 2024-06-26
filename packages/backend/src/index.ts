import AppRoute from "./app.js"
import { PrismaClient } from "@prisma/client"

export default function initializeApp(databaseUrl: string, logger?: (type: "START" | "ROUTE" | "CLOSE", message: { [key: string]: any }) => void, port: number = 8080) {
    AppRoute.set("prisma-client", new PrismaClient({ datasourceUrl: databaseUrl }))

    const routeLogger = (method: string, path: string) => {
        logger ? logger("ROUTE", { method, path }) : void 0
    }

    AppRoute.set("logger", routeLogger)

    AppRoute.listen(port, () => {
        logger ? logger("START", { port }) : void 0
    })
}

initializeApp("postgresql://postgres:password@localhost:5432/sar_db?schema=public", (type, message) => {
    if (type == "START") {
        console.log(`Starting at http://localhost:${message.port}`)
    }
})