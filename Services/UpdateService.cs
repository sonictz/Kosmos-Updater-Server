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
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace KosmosUpdaterServer.Services
{
    class UpdateService : IUpdateService
    {
        private const string GitHubEventHeader = "X-GitHub-Event";
        private const string GitHubSignatureHeader = "X-Hub-Signature";
        private const string GitHubReleaseEvent = "release";
        private const string GitHubSignaturePrefix = "sha1=";

        private readonly IConfigurationService _configurationService;

        public UpdateService(IConfigurationService configurationService)
        {
            _configurationService = configurationService;
        }

        public ApiVersion ParseApiVersion(string ver)
        {
            ApiVersion version;
            if (!Enum.TryParse<ApiVersion>(ver, true, out version))
            {
                throw new ArgumentException();
            }

            return version;
        }

        public Repo ParseRepository(string repo)
        {
            Repo repository;
            if (!Enum.TryParse<Repo>(repo, true, out repository))
            {
                throw new ArgumentException();
            }

            return repository;
        }

        public async Task<bool> ValidateSecretKey(HttpRequest request)
        {
            var eventName = request.Headers[GitHubEventHeader];
            var signature = request.Headers[GitHubSignatureHeader];

            ValidateArguments(eventName, signature);

            using (var reader = new StreamReader(request.Body))
            {
                var body = await reader.ReadToEndAsync();
                return ValidateSignature(signature, body);
            }
        }

        public void WriteCronFile(Repo repo)
        {
            var filesPath = _configurationService.GetFilesPath();

            if (!File.Exists($"{filesPath}/{repo.ToString()}.cron"))
            {
                if (!Directory.Exists(filesPath))
                {
                    Directory.CreateDirectory(filesPath);
                }

                var fs = File.Create($"{filesPath}/{repo.ToString()}.cron");
                fs.Close();
            }
        }

        public async Task<string> GetVersionNumber(Repo repo)
        {
            var filesPath = _configurationService.GetFilesPath();

            if (!File.Exists($"{filesPath}/{repo.ToString()}.version"))
            {
                throw new FileNotFoundException();
            }

            return await File.ReadAllTextAsync($"{filesPath}/{repo.ToString()}.version", Encoding.UTF8);
        }

        public FileStream GetRelease(Repo repo)
        {
            var filesPath = _configurationService.GetFilesPath();
            var releaseFileName = GetReleaseFileName(repo);

            if (!File.Exists($"{filesPath}/{releaseFileName}"))
            {
                throw new FileNotFoundException();
            }
            
            return new FileStream($"{filesPath}/{releaseFileName}", FileMode.Open);
        }

        public string GetReleaseFileName(Repo repo)
        {
            switch (repo)
            {
                case Repo.Kosmos:
                    return "Kosmos.zip";

                case Repo.KosmosUpdater:
                    return "KosmosUpdater.nro";

                default:
                    return null;
            }
        }

        private void ValidateArguments(string eventName, string signature)
        {
            if (string.IsNullOrEmpty(eventName))
            {
                throw new ArgumentNullException($"Missing \"{GitHubEventHeader}\" header.");
            }

            if (!eventName.Equals(GitHubReleaseEvent, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException($"Invalid event.");
            }

            if (string.IsNullOrEmpty(signature))
            {
                throw new ArgumentNullException($"Missing \"{GitHubSignatureHeader}\" header.");
            }

            if (!signature.StartsWith(GitHubSignaturePrefix, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException($"Invalid signature.");
            }
        }

        private bool ValidateSignature(string signatureWithPrefix, string body)
        {
            var signature = signatureWithPrefix.Substring(GitHubSignaturePrefix.Length);
            var secretBytes = Encoding.ASCII.GetBytes(_configurationService.GetGitHubSecretKey());
            var bodyBytes = Encoding.UTF8.GetBytes(body);

            using (var hmSha1 = new HMACSHA1(secretBytes))
            {
                var hash = hmSha1.ComputeHash(bodyBytes);
                var hashString = ToHexString(hash);
                if (hashString.Equals(signature))
                {
                    return true;
                }
            }

            return false;
        }

        private string ToHexString(byte[] bytes)
        {
            var builder = new StringBuilder(bytes.Length * 2);
            foreach (var b in bytes)
            {
                builder.AppendFormat("{0:x2}", b);
            }

            return builder.ToString();
        }
    }
}
