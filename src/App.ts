// Kosmos Updater Server
// Copyright (C) 2019 Nichole Mattera
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

import express from 'express'

export default class App {
    public app: express.Application
    public port: number

    constructor(ctrls: any[], port: number) {
        this.app = express()
        this.port = port

        this.initMiddleware()
        this.initControllers(ctrls)
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`Server is listening on ${ this.port }`)
        })
    }

    private initMiddleware() {
        // Get the body data.
        this.app.use((req, res, next) => {
            if (req.method === 'GET') {
                next()
                return
            }

            let data = ''
            req.setEncoding('utf8')
            req.on('data', (chunk) => {
               data += chunk
            })
            req.on('end', () => {
                req.body = data
                next()
            })
        })

        // Remove express header and prevent caching
        this.app.use((req, res, next) => {
            res.removeHeader('X-Powered-By')
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
            next()
        })

        // Validate user-agent.
        this.app.use((req, res, next) => {
            const userAgent = req.headers['user-agent']
            const path = req.path

            if (
                (
                    userAgent &&
                    path.startsWith('/update') &&
                    userAgent.startsWith('GitHub-Hookshot/')
                ) ||
                (
                    userAgent &&
                    !path.startsWith('/update') &&
                    userAgent.startsWith('kosmos-updater/')
                ) ||
                path.startsWith('/ping')
            ) {
                next()
                return
            }

            res.sendStatus(401)
        })
    }

    private initControllers(ctrls: any[]) {
        ctrls.forEach((ctrl) => {
            this.app.use('/', (new ctrl()).router)
        })
    }
}
