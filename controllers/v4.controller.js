// Kosmos Updater Server
// Copyright (C) 2019 Steven Mattera
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

const fs = require('fs')
const App = require('../models/app.model')
const Package = require('../models/package.model')

module.exports = class V4Controller {
    constructor() {
        this.serverHeader = 'SDFU/4.0'

        this.getApp = this.getApp.bind(this)
        this.getAppVersionNumber = this.getAppVersionNumber.bind(this)
        this.getPackage = this.getPackage.bind(this)
        this.getPackageVersionNumber = this.getPackageVersionNumber.bind(this)
    }

    getApp(req, res) {
        App.findOne({ channel: 'stable' }).sort({ _id: -1 }).exec((err, app) => {
            if (err || app === null) {
                res.status(500)
                res.setHeader('Server', this.serverHeader)
                res.send()
                return
            }

            const stat = fs.statSync(app.path)

            res.status(200)
            res.setHeader('Server', this.serverHeader)
            res.setHeader('Content-Type', 'application/octet-stream')
            res.setHeader('Content-Length', stat.size)
            res.setHeader('Content-Disposition', 'attachment; filename="KosmosUpdater.nro"')
            fs.createReadStream(app.path).pipe(res)
        })
    }

    getAppVersionNumber(req, res) {
        App.findOne({ channel: 'stable' }).sort({ _id: -1 }).exec((err, app) => {
            if (err || app === null) {
                res.status(500)
                res.setHeader('Server', this.serverHeader)
                res.send()
                return
            }

            res.status(200)
            res.setHeader('Server', this.serverHeader)
            res.setHeader('Content-Type', 'text/plain')
            res.setHeader('Content-Length', app.version.length)
            res.send(app.version)
        })
    }

    getPackage(req, res) {
        Package.findOne({ bundle: 'kosmos', channel: 'stable' }).sort({ _id: -1 }).exec((err, pkg) => {
            if (err) {
                res.status(500)
                res.setHeader('Server', this.serverHeader)
                res.send()
                return
            }

            if (pkg === null) {
                res.status(404)
                res.setHeader('Server', this.serverHeader)
                res.send()
                return
            }

            if (req.influxdb) {
                req.influxdb.writeMeasurement('download', [{
                    tags: { bundle: pkg.bundle, channel: pkg.channel },
                    fields: { count: 1 },
                    timestamp: new Date()
                }])
            }

            const stat = fs.statSync(pkg.path)

            res.status(200)
            res.setHeader('Server', this.serverHeader)
            res.setHeader('Content-Type', `application/zip`)
            res.setHeader('Content-Length', stat.size)
            res.setHeader('Content-Disposition', `attachment; filename="${ pkg.bundle }-${ pkg.channel }.zip"`)
            res.setHeader('X-Version-Number', pkg.version)
            res.setHeader('X-Number-Of-Files', pkg.numberOfFiles)

            fs.createReadStream(pkg.path).pipe(res)
        })
    }

    getPackageVersionNumber(req, res) {
        Package.findOne({ channel: 'kosmos' }).sort({ _id: -1 }).exec((err, pkg) => {
            if (err) {
                res.status(500)
                res.setHeader('Server', this.serverHeader)
                res.send()
                return
            }

            if (pkg === null) {
                res.status(404)
                res.setHeader('Server', this.serverHeader)
                res.send()
                return
            }

            res.status(200)
            res.setHeader('Server', this.serverHeader)
            res.setHeader('Content-Type', 'text/plain')
            res.setHeader('Content-Length', pkg.version.length)
            res.send(pkg.version)
        })
    }
}
