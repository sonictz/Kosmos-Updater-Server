// Kosmos Updater Server
// Copyright (C) 2019 Steven Mattera
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

module.exports = class FileSystemService {
    static fileExists(file) {
        return new Promise((resolve) => {
            fs.access(file, fs.F_OK, (err) => {
                if (err) {
                    resolve(false)
                    return
                }
    
                resolve(true)
            })
        })
    }

    static deleteFile(file) {
        return new Promise(async (resolve, reject) => {
            if (!await this.fileExists(file)) {
                resolve()
                return
            }
    
            fs.unlink(file, (err) => {
                if (err) {
                    reject(err)
                    return
                }
    
                resolve()
            })
        })
    }

    static renameFile(oldPath, newPath) {
        return new Promise((resolve, reject) => {
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    reject(err)
                    return
                }
    
                resolve()
            })
        })
    }
}