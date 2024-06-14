import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export type PyJsFaceAPIReturnType<T extends any = any> = {
    ok: true
    data: T
    error: null
} | {
    ok: false
    data: null
    error: {
        code: number
        message: string
    }
}

export const PyJsFaceAPIExePath = join(__dirname, "../../../", "./bin/py-js-face-api.exe")
export const FaceRecognitionModelsDir = join(__dirname, "../../../", "./face_recognition_models")