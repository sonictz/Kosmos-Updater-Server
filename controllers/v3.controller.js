// Kosmos Updater Server
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
const serverHeader = 'SDFU/3.0'

module.exports.getAppVersionNumber = (req, res) => {
    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Length', 5)
    res.send('3.0.1')
}

module.exports.getApp = (req, res) => {
    const path = `${ __dirname }/../res/KosmosUpdater-3.0.1.nro`
    const stat = fs.statSync(path)

    res.status(200)
    res.setHeader('Server', serverHeader)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Disposition', 'attachment; filename="KosmosUpdater.nro"')
    fs.createReadStream(path).pipe(res)
}

module.exports.getPackageVersionNumber = (req, res) => {
    res.status(426)
    res.setHeader('Server', serverHeader)
    res.send()
    return
}

module.exports.getPackage = (req, res) => { 
    res.status(426)
    res.setHeader('Server', serverHeader)
    res.send()
    return
}
