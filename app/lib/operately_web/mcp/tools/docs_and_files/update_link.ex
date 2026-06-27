defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.UpdateLink do
  use OperatelyWeb.Mcp.Tool

  alias Operately.ResourceHubs.Link
  alias OperatelyWeb.Api.Links.Update, as: LinkUpdate
  alias OperatelyWeb.Mcp.Helpers

  @valid_link_types Enum.map(Link.valid_types(), &Atom.to_string/1)

  @impl true
  def definition do
    Definition.new!(
      name: "update_link",
      title: "Update Link",
      description: "Updates the name, URL, type, and optional description of one link.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 196,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Update a link", "arguments" => %{"link_id" => "link_123", "name" => "Updated link", "url" => "https://example.com", "type" => "other"}}],
      input_schema:
        JsonSchema.object(
          %{
            "link_id" => JsonSchema.string("The link identifier."),
            "name" => JsonSchema.string("The link name."),
            "url" => JsonSchema.string("The absolute URL for the link.", format: "uri"),
            "type" => JsonSchema.string("The link type.", enum: @valid_link_types),
            "description" => JsonSchema.string("An optional plain text or markdown description.")
          },
          required: ["link_id", "name", "url", "type"]
        ),
      output_schema:
        JsonSchema.object(
          %{"link" => JsonSchema.any_object("The updated link.")},
          required: ["link"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, link_id} <- Helpers.decode_id(arguments["link_id"]),
         {:ok, description} <- decode_optional_description(arguments["description"]) do
      LinkUpdate.call(conn, %{
        link_id: link_id,
        name: arguments["name"],
        url: arguments["url"],
        type: String.to_existing_atom(arguments["type"]),
        description: description
      })
    end
  end

  defp decode_optional_description(nil), do: {:ok, nil}
  defp decode_optional_description(description), do: Helpers.markdown_to_rich_text_allow_blank(description)
end
