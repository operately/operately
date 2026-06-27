defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateDocument do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateDocument, as: DocumentCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_document",
      title: "Create Document",
      description: "Creates a new document in exactly one space, project, or goal resource hub.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 190,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [%{"title" => "Create a project document", "arguments" => %{"project_id" => "project_123", "name" => "Launch plan", "content" => "# Launch plan"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The parent space identifier."),
            "project_id" => JsonSchema.string("The parent project identifier."),
            "goal_id" => JsonSchema.string("The parent goal identifier."),
            "folder_id" => JsonSchema.string("An optional parent folder identifier."),
            "name" => JsonSchema.string("The document name."),
            "content" => JsonSchema.string("The document body in plain text or markdown.")
          },
          required: ["name", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{"document" => JsonSchema.any_object("The created document.")},
          required: ["document"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, scope_inputs} <- Helpers.decode_hub_scope(arguments),
         {:ok, folder_id} <- Helpers.decode_optional_id(arguments["folder_id"]),
         {:ok, content} <- Helpers.markdown_to_rich_text_allow_blank(arguments["content"]) do
      DocumentCreate.call(conn, Map.merge(scope_inputs, %{
        folder_id: folder_id,
        name: arguments["name"],
        content: content,
        post_as_draft: false,
        subscriber_ids: []
      }))
    end
  end
end
