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

const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const serverHeader = 'SDFU/2.0'

router.get('/app-version-number', (req, res) => {
    const filePath = path.join(__dirname, '/res/app.txt')
    const stat = fs.statSync(filePath)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', stat.size)
    fs.createReadStream(filePath).pipe(res)
})

router.get('/app-download', (req, res) => {
    const filePath = path.join(__dirname, '/res/SDFilesUpdater.nro')
    const stat = fs.statSync(filePath)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Disposition', 'attachment; filename="SDFilesUpdater.nro"')
    fs.createReadStream(filePath).pipe(res)
})

router.get('/version-number/:channel', (req, res) => {
    const channel = validateChannel(req.params.channel)

    if (channel === null) {
        res.status(404)
        res.send('File Not Found')
        return
    }

    const filePath = path.join(__dirname, '/res/' + channel + '.txt')
    const stat = fs.statSync(filePath)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', stat.size)
    fs.createReadStream(filePath).pipe(res)
})

router.get('/download/:launcher/:channel', (req, res) => {
    const launcher = validateLauncher(req.params.launcher)
    const channel = validateChannel(req.params.channel)

    if (launcher === null || channel === null) {
        res.status(404)
        res.send('File Not Found')
        return
    }

    const filePath = path.join(__dirname, '/res/' + launcher + '-' + channel + '.zip')
    const stat = fs.statSync(filePath)
    
    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Disposition', 'attachment; filename="' + launcher + '-' + channel + '.zip"')
    fs.createReadStream(filePath).pipe(res)
})

function validateLauncher(launcher) {
    if (launcher.toLowerCase() === 'hekate' || launcher.toLowerCase() === 'layeredfs') {
        return 'hekate'
    } else if (launcher.toLowerCase() === 'reinx') {
        return 'reinx'
    }

    return null
}

function validateChannel(channel) {
    if (channel.toLowerCase() === 'bleeding-edge') {
        return 'bleedingedge'
    } else if (channel.toLowerCase() === 'stable') {
        return 'stable'
    }

    return null
}

module.exports = router