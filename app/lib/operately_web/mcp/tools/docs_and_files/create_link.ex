defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateLink do
  use OperatelyWeb.Mcp.Tool

  alias Operately.ResourceHubs.Link
  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateLink, as: LinkCreate
  alias OperatelyWeb.Mcp.Helpers

  @valid_link_types Enum.map(Link.valid_types(), &Atom.to_string/1)

  @impl true
  def definition do
    Definition.new!(
      name: "create_link",
      title: "Create Link",
      description: "Creates a new link in exactly one space, project, or goal resource hub.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 195,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Create a project link", "arguments" => %{"project_id" => "project_123", "name" => "Dashboard", "url" => "https://example.com", "type" => "other"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The parent space identifier."),
            "project_id" => JsonSchema.string("The parent project identifier."),
            "goal_id" => JsonSchema.string("The parent goal identifier."),
            "folder_id" => JsonSchema.string("An optional parent folder identifier."),
            "name" => JsonSchema.string("The link name."),
            "url" => JsonSchema.string("The absolute URL for the link.", format: "uri"),
            "type" => JsonSchema.string("The link type.", enum: @valid_link_types),
            "description" => JsonSchema.string("An optional plain text or markdown link description.")
          },
          required: ["name", "url", "type"]
        ),
      output_schema:
        JsonSchema.object(
          %{"link" => JsonSchema.any_object("The created link.")},
          required: ["link"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, scope_inputs} <- Helpers.decode_hub_scope(arguments),
         {:ok, folder_id} <- Helpers.decode_optional_id(arguments["folder_id"]),
         {:ok, type} <- decode_link_type(arguments["type"]),
         {:ok, description} <- decode_optional_description(arguments["description"]) do
      LinkCreate.call(conn, Map.merge(scope_inputs, %{
        folder_id: folder_id,
        name: arguments["name"],
        url: arguments["url"],
        type: type,
        description: description,
        subscriber_ids: []
      }))
    end
  end

  defp decode_link_type(type) when type in @valid_link_types, do: {:ok, String.to_existing_atom(type)}
  defp decode_link_type(_), do: {:error, :invalid_arguments}

  defp decode_optional_description(nil), do: {:ok, nil}
  defp decode_optional_description(description), do: Helpers.markdown_to_rich_text_allow_blank(description)
end
