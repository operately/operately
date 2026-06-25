defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.GetFile do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Files.Get, as: FileGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_file",
      title: "Get File",
      description: "Returns one file by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 94,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Open a file by ID", "arguments" => %{"file_id" => "file_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "file_id" => JsonSchema.string("The file identifier.")
          },
          required: ["file_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "file" => JsonSchema.any_object("The matching file.")
          },
          required: ["file"]
        )
    )
  end

  @impl true
  def call(conn, %{"file_id" => file_id}) do
    with {:ok, file_id} <- Helpers.decode_id(file_id),
         {:ok, %{file: file}} <- FileGet.call(conn, %{id: file_id}) do
      {:ok, %{file: Map.put(file, :comments, Helpers.load_comments(conn, file_id, :resource_hub_file))}}
    end
  end
end
