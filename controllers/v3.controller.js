// SDFile Updater Server
// Copyright (C) 2018 Steven Mattera
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
const serverHeader = 'SDFU/3.0'

module.exports.getAppVersionNumber = (req, res) => {
    App.findOne({ channel: 'stable' }).sort({ _id: -1 }).exec((err, app) => {
        if (err || app === null) {
            res.status(500)
            res.setHeader('Server', serverHeader)
            res.send()
            return
        }

        res.status(200)
        res.setHeader('Server', serverHeader)
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Length', app.version.length)
        res.send(app.version)
    })
}

module.exports.getApp = (req, res) => {
    App.findOne({ channel: 'stable' }).sort({ _id: -1 }).exec((err, app) => {
        if (err || app === null) {
            res.status(500)
            res.setHeader('Server', serverHeader)
            res.send()
            return
        }

        const stat = fs.statSync(app.path)

        res.status(200)
        res.setHeader('Server', serverHeader)
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Content-Length', stat.size)
        res.setHeader('Content-Disposition', 'attachment; filename="SDFilesUpdater.nro"')
        fs.createReadStream(app.path).pipe(res)
    })
}

module.exports.getPackageVersionNumber = (req, res) => {
    Package.findOne({ channel: req.query.channel }).sort({ _id: -1 }).exec((err, package) => {
        if (err) {
            res.status(500)
            res.setHeader('Server', serverHeader)
            res.send()
            return
        }

        if (package === null) {
            res.status(404)
            res.setHeader('Server', serverHeader)
            res.send()
            return
        }

        res.status(200)
        res.setHeader('Server', serverHeader)
        res.setHeader('Content-Type', 'text/plain')
        res.setHeader('Content-Length', package.version.length)
        res.send(package.version)
    })
}

module.exports.getPackage = (req, res) => {
    Package.findOne({ bundle: req.query.bundle, channel: req.query.channel }).sort({ _id: -1 }).exec((err, package) => {
        if (err) {
            res.status(500)
            res.setHeader('Server', serverHeader)
            res.send()
            return
        }

        if (package === null) {
            res.status(404)
            res.setHeader('Server', serverHeader)
            res.send()
            return
        }

        const filePath = package.path
        const stat = fs.statSync(filePath)
        
        res.status(200)
        res.setHeader('Server', serverHeader)
        res.setHeader('Content-Type', 'application/tar')
        res.setHeader('Content-Length', stat.size)
        res.setHeader('Content-Disposition', 'attachment; filename="' + package.bundle + '-' + package.channel + '.tar"')
        res.setHeader('X-Version-Number', package.version)
        res.setHeader('X-Number-Of-Files', package.numberOfFiles)

        fs.createReadStream(filePath).pipe(res)    
    })
}
