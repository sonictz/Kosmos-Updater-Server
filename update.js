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

// TODO: 🔥 Move all this to cron.js and delete this file.

const archiver = require('archiver')
const fs = require('fs')
const git = require('simple-git/promise')
const semver = require('semver')
const copy = require('recursive-copy')
const rmfr = require('rmfr')

class Updater {
    async run() {
        const isStable = process.argv[2] !== 'bleeding-edge'
        let repo

        if (!fs.existsSync(`${ __dirname }/res`)) {
            fs.mkdirSync(`${ __dirname }/res`)
        }

        if (!fs.existsSync(`${ __dirname }/SDFilesSwitch`)) {
            try {
                await git().clone('https://github.com/tumGER/SDFilesSwitch.git', './SDFilesSwitch')
            }
            catch (e) {
                console.error(`Problem cloning repo: ${ e }`)
            }
        }

        repo = git(`${ __dirname }/SDFilesSwitch`)
        await repo.pull('origin', 'master')

        if (isStable) {
            try {
                await repo.fetch('--tags')
                const latestTag = this.getLatestTag(await repo.tags())
                await repo.checkout(`tags/${ latestTag }`)
                await this.writeVersion(latestTag, `${ __dirname }/res/stable.txt`)
            }
            catch (e) {
                console.error(`Problem checking out latest stable: ${ e }`)
            }
        } else {
            try {
                await repo.checkout('master')
                const latestHash = await repo.log({ '-1': null })
                this.writeVersion(latestHash.latest.hash, `${ __dirname }/res/bleedingedge.txt`)
            }
            catch (e) {
                console.error(`Problem checking out latest bleeding edge: ${ e }`)
            }
        }

        try {
            // SDFiles
            await this.buildBundle(
                'sdfiles',
                [
                    'appstore',
                    'atmosphere_hekate',
                    'bootlogo',
                    'edizon',
                    'es_patches',
                    'featured',
                    'hbmenu',
                    'must_have',
                    'reinx',
                    'switchpresence',
                    'sys-ftpd',
                    'sys-netcheat',
                    'tinfoil',
                    'xor.play'
                ],
                isStable)

            // Hekate
            await this.buildBundle(
                'hekate',
                [
                    'hbmenu',
                    'must_have'
                ],
                isStable)

            // Atmosphere
            await this.buildBundle(
                'atmosphere',
                [
                    'atmosphere_hekate',
                    'hbmenu',
                    'must_have'
                ],
                isStable)

            // ReiNX
            await this.buildBundle(
                'reinx',
                [
                    'hbmenu',
                    'must_have',
                    'reinx'
                ],
                isStable)
        }
        catch(e) {
            console.error(`Bundle failed: ${ e }`)
        }
    }

    // Helpers

    getLatestTag(result) {
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
        return tags.find((e) => e.versionNumber == latestVersion).tagName
    }

    async writeVersion(version, path) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(path))
                fs.unlinkSync(path)
        
            fs.writeFile(path, version, (err) => {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        });
    }

    async buildBundle(name, modules, isStable) {
        return new Promise(async (resolve, reject) => {
            const tmpDir = `${ __dirname }/${ (isStable) ? 'stable' : 'bleedingedge' }-temp`
            if (fs.existsSync(tmpDir)) {
                await rmfr(tmpDir)
            }
            fs.mkdirSync(tmpDir)
        
            try {
                for (let i = 0; i < modules.length; i++) {
                    const module = modules[i];
                    await copy(`${ __dirname }/SDFilesSwitch/Modules/${ module }`, tmpDir)
                }
            }
            catch (e) {
                await rmfr(tmpDir)
                reject(name)
            }
        
            await this.archive(tmpDir, `${ __dirname }/res/${ name }-${ (isStable) ? 'stable' : 'bleedingedge' }.zip`)
            await rmfr(tmpDir)
            resolve()
        })
    }
    
    async archive(directory, path) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(path))
                fs.unlinkSync(path)
        
            const output = fs.createWriteStream(path)
            const archive = archiver('zip', {
                zlib: { level: 9 }
            })

            output.on('close', (err) => {
                if (err) {
                    reject()
                }
                else {
                    resolve()
                }
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
        })
    }
}

(new Updater()).run()