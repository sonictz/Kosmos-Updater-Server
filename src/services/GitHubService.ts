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

import crypto from 'crypto'

class GitHubService {
    public static verifyMessageFromGitHub(body: string, signature: string, secret: string, event: string): boolean {
        const hmac = crypto.createHmac('sha1', secret)
        hmac.update(body)

        const calculatedSignature = `sha1=${ hmac.digest('hex') }`
        if (signature !== calculatedSignature) {
            throw new Error('Unauthorized - Incorrect Secret Key')
        }

        return event === 'release'
    }
}

export default GitHubService
