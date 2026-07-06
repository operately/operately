defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.DeleteLink do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Links.Delete, as: LinkDelete
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_link",
      title: "Delete Link",
      description: "Permanently deletes one link from a resource hub.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 225,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Delete a link", "arguments" => %{"link_id" => "link_123"}}],
      input_schema:
        JsonSchema.object(
          %{"link_id" => JsonSchema.string("The link identifier.")},
          required: ["link_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("True when the link is deleted.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, %{"link_id" => link_id}) do
    with {:ok, link_id} <- Helpers.decode_id(link_id),
         {:ok, %{success: true}} <- LinkDelete.call(conn, %{link_id: link_id}) do
      {:ok, %{success: true}}
    end
  end
end
