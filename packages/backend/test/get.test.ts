import { test, expect } from "vitest"
import App from "../src/app.js"
import supertest from "supertest"

test("GET /", async () => {
    let res = await supertest(App)
        .get("/")

    expect(res.status).toEqual(302)
})