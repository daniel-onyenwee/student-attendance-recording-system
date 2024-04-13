import { test, expect } from "vitest"
import App from "../src/app.js"
import supertest from "supertest"

test("GET /process", async () => {
    let expectedResult = {
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
    }

    let res = await supertest(App)
        .get("/process")
        .expect('Content-Type', /json/)
        .expect(200)

    expect(res.body).toEqual(expectedResult)

})
