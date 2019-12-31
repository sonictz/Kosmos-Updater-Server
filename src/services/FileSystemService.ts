// Kosmos Updater Server
// Copyright (C) 2019 Nichole Mattera
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

import fs from 'fs'
import path from 'path'

class FileSystemService {
    public static createParentDirectories(location: string) {
        const targetDirectory = path.dirname(location)
        return fs.promises.mkdir(targetDirectory, { recursive: true })
    }

    public static createFile(location: string) {
        return new Promise<void>(async (resolve, reject) => {
            if (await this.checkIfExists(location)) {
                resolve()
                return
            }

            try {
                await this.createParentDirectories(location)
                await fs.promises.writeFile(location, '')
                resolve()
            } catch {
                reject()
            }
        })
    }

    public static getFileSize(location: string): Promise<number> {
        return new Promise<number>(async (resolve) => {
            try {
                const stats = await fs.promises.stat(location)
                resolve(stats.size)
            } catch {
                resolve(0)
            }
        })
    }

    public static getContents(location: string): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            if (!this.checkIfExists(location)) {
                reject()
                return
            }

            try {
                const buffer = await fs.promises.readFile(location)
                resolve(buffer.toString().trim())
            } catch {
                reject()
            }
        })
    }

    private static checkIfExists(location: string): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            try {
                await fs.promises.stat(location)
                resolve(true)
            } catch {
                resolve(false)
            }
        })
    }
}

export default FileSystemService
