defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.GetLink do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Links.Get, as: LinkGet
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_link",
      title: "Get Link",
      description: "Returns one link by identifier.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 95,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Open a link by ID", "arguments" => %{"link_id" => "link_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "link_id" => JsonSchema.string("The link identifier.")
          },
          required: ["link_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "link" => JsonSchema.any_object("The matching link.")
          },
          required: ["link"]
        )
    )
  end

  @impl true
  def call(conn, %{"link_id" => link_id}) do
    with {:ok, link_id} <- Helpers.decode_id(link_id),
         {:ok, %{link: link}} <- LinkGet.call(conn, %{id: link_id}) do
      {:ok, %{link: Map.put(link, :comments, Helpers.load_comments(conn, link_id, :resource_hub_link))}}
    end
  end
end
