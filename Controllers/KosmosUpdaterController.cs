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

using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using KosmosUpdaterServer.Services;

namespace KosmosUpdaterServer.Controllers
{
    [ApiController]
    public class KosmosUpdaterController : ControllerBase
    {
        private readonly IUpdateService _updateService;

        public KosmosUpdaterController(IUpdateService updateService)
        {
            _updateService = updateService;
        }

        // GET v1/app-download
        [HttpGet("{ver}/app-download")]
        public IActionResult GetLatestApp_OldAPI(string ver)
        {
            return _GetLatestApp(ver, ApiVersion.V1, ApiVersion.V2);
        }

        // GET v1/app-version-number
        [HttpGet("{ver}/app-version-number")]
        public async Task<IActionResult> GetLatestAppVersion_OldAPI(string ver)
        {
            return await _GetLatestAppVersion(ver, ApiVersion.V1, ApiVersion.V2);
        }

        // GET v3/app
        [HttpGet("{ver}/app")]
        public IActionResult GetLatestApp(string ver)
        {
            return _GetLatestApp(ver, ApiVersion.V3);
        }

        // GET v3/app/version-number
        [HttpGet("{ver}/app/version-number")]
        public async Task<IActionResult> GetLatestAppVersion(string ver)
        {
            return await _GetLatestAppVersion(ver, ApiVersion.V3);
        }

        // GET v4/package
        [HttpGet("{ver}/package")]
        public IActionResult GetLatestPackage(string ver)
        {
            return _GetLatestPackage(ver, ApiVersion.V4);
        }

        // GET v4/package/version-number
        [HttpGet("{ver}/package/version-number")]
        public async Task<IActionResult> GetLatestPackageVersion(string ver)
        {
            return await _GetLatestPackageVersion(ver, ApiVersion.V4);
        }

        #region Private Methods

        private IActionResult _GetLatestApp(string ver, ApiVersion minVersion, ApiVersion maxVersion = ApiVersion.V4)
        {
            try
            {
                var version = _updateService.ParseApiVersion(ver);
                if (version < minVersion || version > maxVersion)
                {
                    return NotFound();
                }

                var fs = _updateService.GetRelease(Repo.KosmosUpdater);
                return File(fs, "application/octet-stream", _updateService.GetReleaseFileName(Repo.KosmosUpdater));
            }
            catch (ArgumentException e)
            {
                // From invalid API Version.
                return BadRequest(e.Message);
            }
            catch
            {
                return NoContent();
            }
        }

        private async Task<IActionResult> _GetLatestAppVersion(string ver, ApiVersion minVersion, ApiVersion maxVersion = ApiVersion.V4)
        {
            try
            {
                var version = _updateService.ParseApiVersion(ver);
                if (version < minVersion || version > maxVersion)
                {
                    return NotFound();
                }

                return Ok(await _updateService.GetVersionNumber(Repo.KosmosUpdater));
            }
            catch (ArgumentException e)
            {
                // From invalid API Version.
                return BadRequest(e.Message);
            }
            catch
            {
                // From file not existing on server.
                return NoContent();
            }
        }

        private IActionResult _GetLatestPackage(string ver, ApiVersion minVersion, ApiVersion maxVersion = ApiVersion.V4)
        {
            try
            {
                var version = _updateService.ParseApiVersion(ver);
                if (version < minVersion || version > maxVersion)
                {
                    return NotFound();
                }

                var fs = _updateService.GetRelease(Repo.Kosmos);
                return File(fs, "application/zip", _updateService.GetReleaseFileName(Repo.Kosmos));
            }
            catch (ArgumentException e)
            {
                // From invalid API Version.
                return BadRequest(e.Message);
            }
            catch
            {
                // From file not existing on server.
                return NoContent();
            }
        }

        private async Task<IActionResult> _GetLatestPackageVersion(string ver, ApiVersion minVersion, ApiVersion maxVersion = ApiVersion.V4)
        {
            try
            {
                var version = _updateService.ParseApiVersion(ver);
                if (version < minVersion || version > maxVersion)
                {
                    return NotFound();
                }

                return Ok(await _updateService.GetVersionNumber(Repo.Kosmos));
            }
            catch (ArgumentException e)
            {
                // From invalid API Version.
                return BadRequest(e.Message);
            }
            catch
            {
                // From file not existing on server.
                return NoContent();
            }
        }

        #endregion
    }
}
