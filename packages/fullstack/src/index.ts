import express from "express"
import morgan from "morgan"
import { initializeBackend } from "@student-attendance-recording-system/backend"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import * as https from "node:https"
import * as http from "node:http"
import { getPortPromise } from "portfinder"
import open from "open"


const __dirname = dirname(fileURLToPath(import.meta.url))

const key = readFileSync(join(__dirname, '../cert/localhost-key.pem'));

const cert = readFileSync(join(__dirname, '../cert/localhost.pem'));

const app = express()

app.use(morgan("short"))

async function main() {
    initializeBackend(app, "postgresql://postgres:password@localhost:5432/sar_db?schema=public")

    const httpPort = await getPortPromise()

    http.createServer(app).listen(httpPort)

    const httpsPort = await getPortPromise()

    https.createServer({ key, cert }, app).listen(httpsPort, () => {
        open(`https://localhost:${httpsPort}/app`)
    });
}

main()