const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const serverHeader = 'SDFU/1.0'

router.get('/version-number/:channel', getVersionNumber)
router.get('/download/:channel', getDownload)

function getVersionNumber(req, res) {
    let filePath

    if (req.params.channel == 'bleeding-edge') {
        filePath = path.join(__dirname, '/res/bleedingedge.txt')
    } else {
        filePath = path.join(__dirname, '/res/stable.txt')
    }

    const stat = fs.statSync(filePath)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', stat.size)
    fs.createReadStream(filePath).pipe(res)
}

function getDownload(req, res) {
    let filePath
        
    if (req.params.channel == 'bleeding-edge') {
        filePath = path.join(__dirname, '/res/bleedingedge.zip')
    } else {
        filePath = path.join(__dirname, '/res/stable.zip')
    }
    
    const stat = fs.statSync(filePath)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Length', stat.size)
    fs.createReadStream(filePath).pipe(res)
}

module.exports = {
    router,
    getVersionNumber,
    getDownload
}