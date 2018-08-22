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
const crypto = require('crypto')
const childProcess = require('child_process')
const config = require('../config.json')
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

router.post('/update', (req, res) => {
    const userAgent = req.headers['user-agent']
    if (userAgent === undefined || !userAgent.startsWith('GitHub-Hookshot/')) {
        res.status(401)
        res.send('Unauthorized - Incorrect User Agent')
        return
    }

    const hmac = crypto.createHmac('sha1', config.secret)
    hmac.update(JSON.stringify(req.body))

    const signature = req.headers['x-hub-signature']
    const calculatedSignature = 'sha1=' + hmac.digest('hex')
    if (signature !== calculatedSignature) {
        res.status(401)
        res.send('Unauthorized - Incorrect Secret Key')
        return
    }

    const event = req.headers['x-github-event']
    if (event === 'release') {
        res.status(200)
        res.send('Updated stable files.')

        childProcess.fork('./update.js', ['stable'])
    } else if (event === 'push') {
        res.status(200)
        res.send('Updated bleeding-edge files.')

        childProcess.fork('./update.js', ['bleeding-edge'])
    } else {
        res.status(202)
        res.send('Unable to handle event `' + event + '`.')
    }
})

function validateLauncher(launcher) {
    if (launcher.toLowerCase() === 'hekate') {
        return 'sdfiles'
    } else if (launcher.toLowerCase() === 'layeredfs') {
        return 'sdfiles'
    } else if (launcher.toLowerCase() === 'reinx') {
        return 'sdfiles'
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