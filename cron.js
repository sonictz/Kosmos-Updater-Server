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

const archiver = require('archiver')
const fs = require('fs')
const git = require('simple-git')

if (!fs.existsSync(__dirname + '/SDFilesSwitch')) {
    git().silent(true)
        .clone('https://github.com/tumGER/SDFilesSwitch.git', './SDFilesSwitch')
        .then(() => {
            git(__dirname + '/SDFilesSwitch').silent(true)
                .tags(writeLatestVersion)
                .then(bundleLatestVersion)
        })
} else {
    git(__dirname + '/SDFilesSwitch').silent(true)
        .pull('origin', 'master')
        .tags(writeLatestVersion)
        .then(bundleLatestVersion)
}

function writeLatestVersion(err, result) {
    if (err) {
        console.log('Tags Error: ', err)
        return
    }

    if (fs.existsSync(__dirname + '/latest.txt'))
        fs.unlinkSync(__dirname + '/latest.txt')

    fs.writeFile(__dirname + '/latest.txt', result.latest, (writeErr) => {
        if (writeErr)
            console.log('Write Error: ', writeErr)
    })
}

function bundleLatestVersion() {
    if (fs.existsSync(__dirname + '/latest.zip'))
        fs.unlinkSync(__dirname + '/latest.zip')

    const output = fs.createWriteStream(__dirname + '/latest.zip')
    const archive = archiver('zip', {
        zlib: { level: 9 }
    })

    archive.on('warning', (err) => {
        console.log('Bundle Warning: ', err)
    })

    archive.on('error', (err) => {
        console.log('Bundle Error: ', err)
    })

    archive.pipe(output)
    archive.directory(__dirname + '/SDFilesSwitch/Compiled/', false)
    archive.finalize()
}