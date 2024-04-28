import AppRoute from "./app.js"
import { faceDetectionNet } from "./utils/index.js"

AppRoute.listen(8080, async () => {
    await faceDetectionNet.loadFromDisk("./models")
    console.log("Starting server at http://localhost:8080")
})