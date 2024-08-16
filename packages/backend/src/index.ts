import AppRoute from "./app.js"
import { PrismaClient } from "@prisma/client"
import express, { Express } from "express"

export default function App(databaseUrl: string, logger?: (type: "START" | "ROUTE" | "CLOSE", message: { [key: string]: any }) => void, port: number = 8080) {
    let app = express()

    app.set("prisma-client", new PrismaClient({ datasourceUrl: databaseUrl }))

    const routeLogger = (method: string, path: string) => {
        logger ? logger("ROUTE", { method, path }) : void 0
    }

    app.set("logger", routeLogger)

    app.use(AppRoute)

    return app
}

export function initializeBackend(app: Express, databaseUrl: string, routePath: string = "/api") {
    app.set("prisma-client", new PrismaClient({ datasourceUrl: databaseUrl }))

    app.use(routePath, AppRoute)
}