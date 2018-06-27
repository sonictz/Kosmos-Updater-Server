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
const http = require('http')
const path = require('path')

const portNumber = 80
const serverHeader = 'SDFU/1.0'

const server = http.createServer((request, response) => {
    const url = (!request.url.endsWith('/')) ? request.url + '/' : request.url,
        method = request.method

    if (url === '/' && method === 'GET') {
        var filePath = path.join(__dirname, '/latest.txt')
        var stat = fs.statSync(filePath)

        response.writeHead(200, {
            'Server': serverHeader,
            'Content-Type': 'text/plain',
            'Content-Length': stat.size
        })

        fs.createReadStream(filePath).pipe(response)
    } else if (url === '/download/' && method === 'GET') {
        var filePath = path.join(__dirname, '/latest.zip')
        var stat = fs.statSync(filePath)

        response.writeHead(200, {
            'Server': serverHeader,
            'Content-Type': 'application/zip',
            'Content-Length': stat.size
        })

        fs.createReadStream(filePath).pipe(response)
    } else {
        response.writeHead(404)
        response.end('<h1>404 File Not Found</h1>')
    }
})

server.listen(portNumber, (err) => {
    if (err) {
        return console.log('Something bad happened: ', err)
    }

    console.log(`Server is listening on ${ portNumber }`)
})
