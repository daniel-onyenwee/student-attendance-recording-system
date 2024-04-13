import express from "express"

const ProcessRoute = express.Router()

ProcessRoute.get("/", (_, res) => {
    res.json({
        ok: true,
        error: null,
        data: {
            version: "v0.1.0",
            versions: {
                "@student-attendance-recording-system/backend": "0.1.0",
                "express": "4.19.2",
                "@prisma/client": "^5.12.1",
            },
            arch: process ? process.arch : null,
            platform: process ? process.platform : null
        }
    })
})

export default ProcessRoute