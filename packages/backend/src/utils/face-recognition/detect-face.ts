import { FaceRecognitionModelsDir, PyJsFaceAPIExePath } from "./constants.js"
import type { PyJsFaceAPIReturnType } from "./constants.js"
import { spawn } from "node:child_process"

interface DetectFaceAPIReturnType {
    face_count: number
}

export default async function detectFace(faceImageData: string): Promise<PyJsFaceAPIReturnType<DetectFaceAPIReturnType>> {
    return new Promise(function (resolve, _) {
        let stdoutCount = 0
        let shellProcess = spawn(PyJsFaceAPIExePath, ["detect", FaceRecognitionModelsDir])

        shellProcess.stdout.on('data', (chunk) => {
            let message = chunk.toString("utf-8")
            stdoutCount += 1
            if (stdoutCount == 1 || message == "face_image_data: ") {
                shellProcess.stdin.write(faceImageData + "\n")
            } else if (stdoutCount == 2) {
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