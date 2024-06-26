import { FaceRecognitionModelsDir, PyJsFaceAPIExePath } from "./constants.js"
import type { PyJsFaceAPIReturnType } from "./constants.js"
import { spawn } from "node:child_process"

export default async function recognizeFace(faceImageData: string, knowFaceImageData: string): Promise<PyJsFaceAPIReturnType<null>> {
    return new Promise(function (resolve, _) {
        let stdoutCount = 0
        let shellProcess = spawn(PyJsFaceAPIExePath, ["recognize", FaceRecognitionModelsDir])

        shellProcess.stdout.on('data', (chunk) => {
            let message = chunk.toString("utf-8")
            stdoutCount += 1
            if (stdoutCount == 1 || message == "face_image_data: ") {
                shellProcess.stdin.write(faceImageData + "\n")
            } else if (stdoutCount == 2 || message == "know_face_image_data: ") {
                shellProcess.stdin.write(knowFaceImageData + "\n")
            } else if (stdoutCount == 3) {
                resolve(JSON.parse(message))
            }
        })

        shellProcess.stderr.on('data', (e) => {
            resolve({
                ok: false,
                data: null,
                error: {
                    code: 0,
                    message: "Unexpected error"
                }
            })
        })
    })
}