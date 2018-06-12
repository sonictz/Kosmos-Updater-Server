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

const crc32 = require('crc-32')
const fs = require('fs')
const net = require('net')

const currentVersion = 'SDFU/1.0'

const server = net.createServer((socket) => {
    let buffer = ''

    socket.write(generatePacket(200))

    socket.on('data', (data) => {
        buffer += data.toString()

        // Parse out message.
        if (buffer.indexOf('\r\n') !== -1) {
            const message = buffer.substr(0, buffer.indexOf('\r\n') + 2)
            handleMessage(message, socket)
            buffer = buffer.substr(buffer.indexOf('\r\n') + 2)
        }

        // Prevent someone from sending large amount of garbage data.
        if (buffer.length >= 256) {
            buffer = ''
            socket.write(generatePacket(400, 'Stop it, Get Some Help'))
        }
    })

    socket.on('end', () => {
        buffer = ''
    })
})

server.listen(9001)

function generatePacket(statusCode, body = '') {
    const checksum = crc32.str(body),
        length = currentVersion.length + (statusCode + '').length + (checksum + '').length + body.length + 9
    return `${ currentVersion } ${ statusCode } ${ checksum } ${ length }\r\n${ body }\r\n\r\n`
}

function handleMessage(message, socket) {
    const splitMessage = message.split(' ')
    if (splitMessage.length !== 2) {
        socket.write(generatePacket(400))
        return
    }

    splitMessage[1] = splitMessage[1].substr(0, splitMessage[1].length - 2)
    if (splitMessage[1] !== currentVersion) {
        socket.write(generatePacket(505))
        return
    }

    if (splitMessage[0] === 'get-latest-version') {
        fs.readFile('latest.txt', 'utf-8', (err, data) => {
            socket.write(generatePacket(200, data))
        })
    } else if (splitMessage[0] === 'get-latest') {
        fs.readFile('latest.zip', 'base64', (err, data) => {
            socket.write(generatePacket(200, data))
        })
    } else {
        socket.write(generatePacket(405))
    }
}
