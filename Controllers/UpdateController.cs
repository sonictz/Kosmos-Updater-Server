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
    [Route("update")]
    [ApiController]
    public class UpdateController : ControllerBase
    {
        private readonly IUpdateService _updateService;

        public UpdateController(IUpdateService updateService)
        {
            _updateService = updateService;
        }

        // POST update/kosmos 
        [HttpPost("{repo}")]
        public async Task<IActionResult> PostUpdate(string repo)
        {
            try
            {
                var repository = _updateService.ParseRepository(repo);
                
                // Make sure our secret key is valid.
                if (!(await _updateService.ValidateSecretKey(Request)))
                {
                    return Unauthorized("Unauthorized - Incorrect Secret Key");
                }

                // Write the file for our cron job.
                _updateService.WriteCronFile(repository);
                return Ok("OK");
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }
}
