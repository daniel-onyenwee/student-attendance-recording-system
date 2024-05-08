import express from "express"
import { authAccess } from "../../middleware/index.js"
import { prismaClient } from "../../utils/index.js"
import { nanoid } from "nanoid"
import RecordRoute from "./record/index.js"
import AttendanceRoute from "./attendance/index.js"
import ReportRoute from "./report/index.js"

interface AdminRequestBody {
    username: string
    password: string
}

const AdminRoute = express.Router()

AdminRoute.use(authAccess("ADMIN"))

AdminRoute.get("/", async (req, res) => {
    let userId = req.app.get("user-id")

    let admin = await prismaClient.admin.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            username: true,
            password: true,
            createdAt: true,
            user: {
                select: {
                    refreshToken: true
                }
            },
            updatedAt: true
        }
    })

    if (!admin) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Admin not found",
                code: 3001
            },
            data: null
        })
        return
    }

    const { password, id, updatedAt, username, createdAt, user: { refreshToken } } = admin
    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            username,
            password,
            refreshToken,
            createdAt,
            updatedAt
        },
        error: null
    })
})

AdminRoute.post("/", async (req, res) => {
    let body: AdminRequestBody | null = req.body

    if (!body || Object.keys(body || {}).length == 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Request body missing",
                code: 1004
            },
            data: null
        })
        return
    }

    if (!body.username) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'username'",
                code: 2001
            },
            data: null
        })
        return
    }

    if (!body.password) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Missing parameter 'password'",
                code: 2002
            },
            data: null
        })
        return
    }

    const usernameCount = await prismaClient.admin.count({
        where: {
            username: body.username
        }
    })

    if (usernameCount > 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Username already exist",
                code: 2006
            },
            data: null
        })
        return
    }

    let generatedRefreshToken = nanoid(64)

    const { password, id, updatedAt, username, createdAt, user: { refreshToken } } = await prismaClient.admin.create({
        data: {
            username: body.username,
            password: body.password,
            user: {
                create: {
                    refreshToken: generatedRefreshToken,
                    type: "ADMIN"
                }
            }
        },
        select: {
            id: true,
            username: true,
            password: true,
            createdAt: true,
            user: {
                select: {
                    refreshToken: true
                }
            },
            updatedAt: true
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            username,
            password,
            refreshToken,
            createdAt,
            updatedAt
        },
        error: null
    })
})

AdminRoute.patch("/", async (req, res) => {
    let body: AdminRequestBody = req.body || {}
    let userId = req.app.get("user-id")
    let updateData: Partial<AdminRequestBody> = {}

    const adminCount = await prismaClient.admin.count({
        where: {
            id: userId
        }
    })

    if (adminCount <= 0) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Admin not found",
                code: 3001
            },
            data: null
        })
        return
    }

    if (body.username) {
        const usernameCount = await prismaClient.admin.count({
            where: {
                username: body.username,
                id: {
                    not: {
                        equals: userId
                    }
                }
            }
        })

        if (usernameCount > 0) {
            res.status(400)
            res.json({
                ok: false,
                error: {
                    message: "Username already exist",
                    code: 2006
                },
                data: null
            })
            return
        }

        updateData.username = body.username
    }

    if (body.password) {
        updateData.password = body.password
    }

    const admin = await prismaClient.admin.update({
        where: {
            id: userId
        },
        data: updateData,
        select: {
            id: true,
            username: true,
            password: true,
            createdAt: true,
            user: {
                select: {
                    refreshToken: true
                }
            },
            updatedAt: true
        }
    })

    if (!admin) {
        res.status(400)
        res.json({
            ok: false,
            error: {
                message: "Admin not found",
                code: 3001
            },
            data: null
        })
        return
    }

    const { password, id, updatedAt, username, createdAt, user: { refreshToken } } = admin
    res.status(200)
    res.json({
        ok: true,
        data: {
            id,
            username,
            password,
            refreshToken,
            createdAt,
            updatedAt
        },
        error: null
    })
})

AdminRoute.delete("/", async (req, res) => {
    let userId = req.app.get("user-id")

    let { refreshToken, admins: [otherData] } = await prismaClient.user.delete({
        where: { id: userId },
        select: {
            refreshToken: true,
            admins: {
                distinct: ["id"],
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    username: true,
                    password: true
                }
            }
        }
    })

    res.status(200)
    res.json({
        ok: true,
        data: {
            ...otherData,
            refreshToken
        },
        error: null
    })
})

AdminRoute.use("/record", RecordRoute)

AdminRoute.use("/attendance", AttendanceRoute)

AdminRoute.use("/report", ReportRoute)

export default AdminRoute