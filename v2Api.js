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
    const filePath = path.join(__dirname, '/res/SDFileUpdater.nro')
    const stat = fs.statSync(filePath)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Disposition', 'attachment; filename="SDFileUpdater.nro"')
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
    if (launcher.toLowerCase() === 'hekate') {
        return 'hekate'
    } else if (launcher.toLowerCase() === 'layeredfs') {
        return 'layeredfs'
    } else if (launcher.toLowerCase() === 'switchblade') {
        return 'switchblade'
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