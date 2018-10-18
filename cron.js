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

const mongoose = require('mongoose')
const config = require('./config.json')
const fs = require('fs')
const git = require('simple-git/promise')
const semver = require('semver')
const rmfr = require('rmfr')
const copy = require('recursive-copy')
const archiver = require('archiver')
const uuidv4 = require('uuid/v4');
const countFiles = require('count-files')
const Cron = require('./models/cron.model')
const Package = require('./models/package.model')

class Updater {
    constructor() {
        mongoose.connect(config.mongodb, { useNewUrlParser: true, useFindAndModify: false })
        mongoose.Promise = global.Promise
        const db = mongoose.connection
        db.on('error', (err) => {
            console.error(`MongoDB connection error: ${ err }`)
        })
    }

    run() {
        return new Promise(async (resolve, reject) => {
            let crons;
            try {
                crons = await this._findCronsToRun()
            }
            catch (e) {
                reject(`Unable to find crons to run: ${ e }`)
                return
            }

            if (crons.length === 0) {
                console.log('No crons need to update.')
                resolve()
                return
            }

            let repo;
            try {
                repo = await this._setupRepo()
            } catch (e) {
                reject(e)
                return
            }

            for (let i = 0; i < crons.length; i++) {
                const cron = crons[i];
                console.log(`Running cron for ${ cron.channel }`)
                const isStable = (cron.channel === 'stable')

                try {
                    //await this._updateCronToNotRun(cron._id)
                }
                catch (e) {
                    reject(`Unable to update cron to not run: ${ e }`)
                    return
                }

                try {
                    let results;

                    console.log(`Get the latest version for ${ cron.channel }...`)
                    const version = await this._getLatestVersion(isStable, repo)

                    console.log(`Write the version to file for legacy APIs...`)
                    await this._writeVersion(version, `${ __dirname }/res/${ cron.channel }.txt`)

                    console.log(`Build the bundle for sdfiles...`)
                    results = await this._buildBundle(
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
                    await this._createPackage(version, 'sdfiles', cron.channel, results.numberOfFiles, results.path)

                    console.log(`Build the bundle for hekate...`)
                    results = await this._buildBundle(
                        'hekate',
                        [
                            'hbmenu',
                            'must_have'
                        ],
                        isStable)
                    await this._createPackage(version, 'hekate', cron.channel, results.numberOfFiles, results.path)

                    console.log(`Build the bundle for atmosphere...`)
                    results = await this._buildBundle(
                        'atmosphere',
                        [
                            'atmosphere_hekate',
                            'hbmenu',
                            'must_have'
                        ],
                        isStable)
                    await this._createPackage(version, 'atmosphere', cron.channel, results.numberOfFiles, results.path)

                    console.log(`Build the bundle for reinx...`)
                    results = await this._buildBundle(
                        'reinx',
                        [
                            'hbmenu',
                            'must_have',
                            'reinx'
                        ],
                        isStable)
                    await this._createPackage(version, 'reinx', cron.channel, results.numberOfFiles, results.path)
                } catch (e) {
                    reject(e)
                    return
                }
            }

            resolve()
        })
    }

    disconnect() {
        mongoose.disconnect()
    }

    /* DB Related Methods */

    _findCronsToRun() {
        return new Promise((resolve, reject) => {
            Cron.find({ shouldRun: true}, (err, crons) => {
                if (err) {
                    reject(err)
                    return
                }
    
                resolve(crons)
            })
        })
    }

    _updateCronToNotRun(id) {
        return new Promise((resolve, reject) => {
            Cron.findOneAndUpdate({ _id: id }, { $set: { shouldRun: false }}, (err) => {
                if (err) {
                    reject(err)
                }
    
                resolve()
            })
        })
    }

    _createPackage(version, bundle, channel, numberOfFiles, path) {
        return new Promise((resolve, reject) => {
            let pkg = new Package({
                version,
                bundle,
                channel,
                numberOfFiles,
                path
            })
            pkg.save((err) => {
                if (err) {
                    reject(`Unable to save package to MongoDB: ${ err }`)
                    return
                }
                resolve()
            })
        })
    }

    /* Helper Methods */

    _setupRepo() {
        return new Promise(async (resolve, reject) => {
            // Create resource directory if it doesn't exists.
            if (!fs.existsSync(`${ __dirname }/res`)) {
                fs.mkdirSync(`${ __dirname }/res`)
            }

            // Clone the repo if it doesn't exists.
            if (!fs.existsSync(`${ __dirname }/SDFilesSwitch`)) {
                try {
                    console.log('Checking out repo...')
                    await git().clone('https://github.com/tumGER/SDFilesSwitch.git', './SDFilesSwitch')
                }
                catch (e) {
                    reject(`Problem cloning repo: ${ e }`)
                    return
                }
            }

            // Create our repo object and pull the latest.
            const repo = git(`${ __dirname }/SDFilesSwitch`)
            try {
                console.log('Checking out the master branch...')
                await repo.checkout('master')
            }
            catch (e) {
                reject(`Problem checking out master: ${ e }`)
                return
            }

            try {
                console.log('Pulling the latest from the master branch on remote origin...')
                await repo.pull('origin', 'master')
            }
            catch (e) {
                reject(`Problem pulling master from Origin: ${ e }`)
                return
            }

            resolve(repo)
        })
    }

    _getLatestVersion(isStable, repo) {
        return new Promise(async (resolve, reject) => {
            let version;

            if (isStable) {
                try {
                    await repo.fetch('--tags')
                    let tags = await repo.tags()
                    version = this._getLatestTag(tags)
                    await repo.checkout(`tags/${ version }`)
                }
                catch (e) {
                    reject(`Problem checking out latest stable: ${ e }`)
                    return
                }
            } else {
                try {
                    await repo.checkout('master')
                    version = (await repo.log({ '-1': null })).latest.hash
                }
                catch (e) {
                    reject(`Problem checking out latest bleeding edge: ${ e }`)
                    return
                }
            }

            resolve(version)
        })
    }

    _getLatestTag(result) {
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

    _writeVersion(version, path) {
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

    _buildBundle(name, modules, isStable) {
        return new Promise(async (resolve, reject) => {
            const tmpDir = `${ __dirname }/temp`
            if (fs.existsSync(tmpDir)) {
                try {
                    await rmfr(tmpDir)
                } catch (e) {
                    reject(`Problem deleting old temp directory: ${ e }`)
                    return
                }
            }
            fs.mkdirSync(tmpDir)

            for (let i = 0; i < modules.length; i++) {
                const module = modules[i];
                try {
                    await copy(`${ __dirname }/SDFilesSwitch/Modules/${ module }`, tmpDir)
                } catch (e) {
                    reject(`Problem copying module: ${ e }`)
                    return
                }
            }

            try {
                await this._archive('zip', tmpDir, `${ __dirname }/res/${ name }-${ (isStable) ? 'stable' : 'bleedingedge' }.zip`)
            } catch (e) {
                reject(`Problem creating legacy zip file: ${ e }`)
                return
            }

            const path = `${ __dirname }/res/${ uuidv4() }.tar`
            try {
                await this._archive('tar', tmpDir, path)
            } catch (e) {
                reject(`Problem creating tar file: ${ e }`)
                return
            }

            let stats;
            try {
                stats = await this._getNumberOfFiles(tmpDir)
            } catch (e) {
                reject(`Problem getting number of files: ${ e }`)
                return
            }

            try {
                await rmfr(tmpDir)
            } catch (e) {
                reject(`Problem deleting temp directory: ${ e }`)
                return
            }

            resolve({ path, numberOfFiles: stats.files })
        })
    }

    _archive(type, directory, path) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(path))
                fs.unlinkSync(path)
        
            const output = fs.createWriteStream(path)
            const archive = archiver(type, (type === 'zip') ? {
                zlib: { level: 9 }
            } : {})

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

    _getNumberOfFiles(directory) {
        return new Promise((resolve, reject) => {
            countFiles(directory, (err, results) => {
                if (err) {
                    reject(err)
                    return
                }

                resolve(results)
            })
        })
    }
}

let updater = new Updater()
updater.run()
    .then(() => {
        updater.disconnect()
    })
    .catch((err) => {
        console.error(err)
        updater.disconnect()
    })
