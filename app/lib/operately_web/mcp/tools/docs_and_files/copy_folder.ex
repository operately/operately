defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CopyFolder do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ResourceHubs.CopyFolder, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @impl true
  def definition do
    Definition.new!(
      name: "copy_folder",
      title: "Copy Folder",
      description: "Copies a folder and its contents within the same resource hub. Omit dest_parent_folder_id to copy to the hub root; omit folder_name to preserve the source folder name.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 215,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Copy Folder", "arguments" => %{"folder_id" => "folder_123", "folder_name" => "Copy"}}],
      input_schema:
        JsonSchema.object(
          %{
            "folder_id" => JsonSchema.string("The source folder identifier."),
            "folder_name" => JsonSchema.string("Optional name for the copy."),
            "dest_parent_folder_id" => JsonSchema.string("Destination folder in the same resource hub; omit for the root.")
          },
          required: ["folder_id"]
        ),
      output_schema: JsonSchema.object(%{"folder_id" => JsonSchema.string("The copied folder identifier.")}, required: ["folder_id"])
    )
  end

  @impl true
  def call(conn, %{"folder_id" => id} = arguments) when is_binary(id) do
    with {:ok, id} <- Helpers.decode_id(id),
         {:ok, inputs} <- Helpers.put_present(%{folder_id: id}, arguments, "dest_parent_folder_id", :dest_parent_folder_id, &Helpers.decode_optional_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "folder_name", :folder_name, &Inputs.string/1) do
      Api.call(conn, inputs)
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
