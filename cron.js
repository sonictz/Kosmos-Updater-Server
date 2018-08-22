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
const semver = require('semver')

let latestTag;

if (!fs.existsSync(__dirname + '/res')) {
    fs.mkdirSync(__dirname + '/res')
}

if (!fs.existsSync(__dirname + '/SDFilesSwitch')) {
    git().silent(true)
        .clone('https://github.com/tumGER/SDFilesSwitch.git', './SDFilesSwitch')
        .then(() => {
            (process.argv[2] == 'bleeding-edge') ? getLatestBleedingEdge() : getLatestStable()
        });
} else {
    (process.argv[2] == 'bleeding-edge') ? getLatestBleedingEdge() : getLatestStable()    
}

// Stable

function getLatestStable() {
    git(__dirname + '/SDFilesSwitch').silent(true)
        .pull('origin', 'master')
        .fetch('--tags', () => { /* Do Nothing */ })
        .tags(writeLatestStableVersion)
        .checkout('tags/${ latestTag }', bundleLatestStableVersion)
}

function writeLatestStableVersion(err, result) {
    if (err) {
        console.log('Tags Error: ', err)
        return
    }

    const tags = result.all.map((e) => {
        // Remove any letters from the tag name.
        let versionNumber = e.replace(/[^0-9.]/g, '')

        // Remove any preceding zeros.
        versionNumber = versionNumber.split('.').map((e) => parseInt(e).toString()).join('.')

        // Normailze the versions.
        switch((versionNumber.match(/[.]/g) || []).length) {
            case 0:
                versionNumber += '.0.0'
                break

            case 1:
                versionNumber += '.0'
                break
        }

        return {
            versionNumber,
            tagName: e
        }
    })

    const latestVersion = semver.maxSatisfying(tags.map((e) => e.versionNumber), '*')
    const latestTag = tags.find((e) => e.versionNumber == latestVersion)

    writeVersion(latestTag.tagName, __dirname + '/res/stable.txt')
}

function bundleLatestStableVersion() {
    archive(__dirname + '/SDFilesSwitch/SDFiles', __dirname + '/res/sdfiles-stable.zip')
}

// Bleeding Edge

function getLatestBleedingEdge() {
    git(__dirname + '/SDFilesSwitch').silent(true)
        .pull('origin', 'master')
        .log({ '-1': null }, writeLatestBleedingEdgeVersion)
        .checkout('master', bundleLatestBleedingEdgeVersion)
}

function writeLatestBleedingEdgeVersion(err, result) {
    if (err) {
        console.log('Log Error: ', err)
        return
    }

    writeVersion(result.latest.hash, __dirname + '/res/bleedingedge.txt')
}

function bundleLatestBleedingEdgeVersion() {
    archive(__dirname + '/SDFilesSwitch/SDFiles', __dirname + '/res/sdfiles-bleedingedge.zip')
}

// Helper Functions

function writeVersion(version, path) {
    if (fs.existsSync(path))
        fs.unlinkSync(path)

    fs.writeFile(path, version, (writeErr) => {
        if (writeErr)
            console.log('Write Error: ', writeErr)
    })
}

function archive(directory, path) {
    if (fs.existsSync(path))
        fs.unlinkSync(path)

    const output = fs.createWriteStream(path)
    const archive = archiver('zip', {
        zlib: { level: 9 }
    })

    archive.on('warning', (err) => {
        console.log('Bundle Warning: ', path, ' - ', err)
    })

    archive.on('error', (err) => {
        console.log('Bundle Error: ', path, ' - ', err)
    })

    archive.pipe(output)
    archive.directory(directory, false)
    archive.finalize()
}