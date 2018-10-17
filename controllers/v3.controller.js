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
const path = require('path')
const serverHeader = 'SDFU/3.0'

module.exports.getAppVersionNumber = (req, res) => {
    // TODO: 🔥 Pull from MongoDB
    const filePath = path.join(__dirname, '../res/app.txt')
    const stat = fs.statSync(filePath)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', stat.size)
    fs.createReadStream(filePath).pipe(res)
}

module.exports.getApp = (req, res) => {
    // TODO: 🔥 Pull path from MongoDB
    const filePath = path.join(__dirname, '../res/SDFilesUpdater.nro')
    const stat = fs.statSync(filePath)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Disposition', 'attachment; filename="SDFilesUpdater.nro"')
    fs.createReadStream(filePath).pipe(res)
}

module.exports.getPackageVersionNumber = (req, res) => {
    const channel = validateChannel(req.params.channel)

    if (channel === null) {
        res.status(404)
        res.send('File Not Found')
        return
    }

    // TODO: 🔥 Pull from MongoDB
    const filePath = path.join(__dirname, '../res/' + channel + '.txt')
    const stat = fs.statSync(filePath)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', stat.size)
    fs.createReadStream(filePath).pipe(res)
}

module.exports.getPackage = (req, res) => {
    // TODO: 🔥 Pull path from MongoDB based on req.query.bundle and req.query.channel
    const filePath = path.join(__dirname, '../res/' + launcher + '-' + channel + '.tar')
    const stat = fs.statSync(filePath)
    
    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'application/tar')
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Disposition', 'attachment; filename="' + launcher + '-' + channel + '.tar"')

    // TODO: 🔥 Pull from MongoDB
    res.setHeader('X-Version-Number', '10.0.0')
    res.setHeader('X-Number-Of-Files', '54')

    fs.createReadStream(filePath).pipe(res)
}
