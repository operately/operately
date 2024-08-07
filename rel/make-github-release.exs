Mix.install([:req, :jason])

defmodule Uploader do
  def version(), do: System.argv() |> List.first()
  def token(), do: System.get_env("GITHUB_TOKEN")

  def run do
    validate_version()
    validate_token()
    validate_zip()

    id = create_release()
    upload_single_host_zip(id)
  end

  def create_release do
    url = "https://api.github.com/repos/operately/operately/releases"
    headers = build_header("application/json")

    payload = %{
      tag_name: version(),
      target_commitish: "main",
      name: "Operately #{version()}",
      body: "",
      draft: false,
      prerelease: false,
      generate_release_notes: true
    }

    case Req.post(url, headers: headers, json: payload) do
      {:ok, %{status: 201, body: %{"id" => id}}} -> 
        IO.puts("* Release created successfully")
        id

      {:ok, %{status: code} = res} -> 
        raise "Error: #{code} #{inspect(res)}"

      {:error, reason} -> 
        raise "Error: #{reason}"
    end
  end

  def upload_single_host_zip(id) do
    file = File.read!("build/single-host-#{version()}.zip")
    url = "https://uploads.github.com/repos/operately/operately/releases/#{id}/assets?name=single-host-#{version()}.zip"
    headers = build_header("application/octet-stream")

    case Req.post(url, headers: headers, body: file) do
      {:ok, %{status: 201}} -> IO.puts("* single-host-#{version}.zip uploaded successfully")
      {:ok, %{status: code} = res} -> raise "Error: #{code} #{inspect(res)}"
      {:error, reason} -> raise "Error: #{reason}"
    end
  end

  def build_header(content_type) do
    [
      {"Accept", "application/vnd.github+json"},
      {"Authorization", "Bearer #{token()}"},
      {"X-GitHub-Api-Version", "2022-11-28"},
      {"Content-Type", content_type}
    ]
  end

  def validate_version do
    if version() == nil || version() == "" || String.length(version()) < 2 do
      raise "Error: Version is required, e.g elixir rel/github-release.exs 1.0.0"
    end
  end

  def validate_token do
    if token() == nil || token() == "" do
      raise "Error: GITHUB_TOKEN is required"
    end
  end

  def validate_zip do
    if !File.exists?("build/single-host-#{version()}.zip") do
      raise "Error: #{path} does not exist"
    end
  end
end

Uploader.run()
