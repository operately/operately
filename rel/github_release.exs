Mix.install([:req, :jason])

version = System.get_env("VERSION") || raise "VERSION is required"
token = System.get_env("GITHUB_TOKEN") || raise "GITHUB_TOKEN is required"

url = "https://api.github.com/repos/operately/operately/releases"

headers = [
  {"Accept", "application/vnd.github+json"},
  {"Authorization", "Bearer #{token}"},
  {"X-GitHub-Api-Version", "2022-11-28"}
]

payload = %{
  tag_name: version,
  target_commitish: "main",
  name: "Operately #{version}",
  body: "",
  draft: false,
  prerelease: false,
  generate_release_notes: false
}

Req.post(url, headers: headers, json: payload)
