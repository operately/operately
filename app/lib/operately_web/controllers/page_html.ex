defmodule OperatelyWeb.PageHTML do
  use OperatelyWeb, :html

  embed_templates "page.html"

  def js_files do
    js_manifest()
    |> Enum.map(fn {_, asset} -> asset["file"] end)
    |> Enum.map(fn path -> "/" <> path end)
  end

  defp js_manifest do
    priv_path = :code.priv_dir(:operately)
    manifest_path = Path.join(priv_path, "static/.vite/manifest.json")
    manifest = File.read!(manifest_path)

    Jason.decode!(manifest)
  end
end
