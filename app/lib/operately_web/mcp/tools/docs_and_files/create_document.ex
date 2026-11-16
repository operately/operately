defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateDocument do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateDocument, as: DocumentCreate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_document",
      title: "Create Document",
      description:
        "Creates a new document in a live space, project, or goal Docs & Files hub. Set post_as_draft to save without publishing. For reusable documents inside a project template, use create_project_template_document.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 190,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "docs_and_files"},
      examples: [
        %{
          "title" => "Save a document draft",
          "arguments" => %{"space_id" => "space_123", "name" => "Launch plan", "content" => "# Launch plan", "post_as_draft" => true}
        },
        %{
          "title" => "Write a document with a table",
          "arguments" => %{
            "project_id" => "project_123",
            "name" => "Launch plan",
            "content" => "| Milestone | Status |\n| --- | --- |\n| **Launch** | Ready |"
          }
        },
        %{
          "title" => "Create a project document",
          "arguments" => %{"project_id" => "project_123", "name" => "Launch plan", "content" => "# Launch plan"}
        },
        %{
          "title" => "Create a document and notify people",
          "arguments" => %{
            "project_id" => "project_123",
            "name" => "Launch plan",
            "content" => "# Launch plan",
            "notify_person_ids" => ["person_123"]
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "resource_hub_id" => JsonSchema.string("Explicit hub identifier. Without it or a folder, space_id selects the default resource hub."),
            "space_id" => JsonSchema.string("The parent space identifier."),
            "project_id" => JsonSchema.string("The parent project identifier."),
            "goal_id" => JsonSchema.string("The parent goal identifier."),
            "folder_id" => JsonSchema.string("An optional parent folder identifier."),
            "name" => JsonSchema.string("The document name."),
            "post_as_draft" => JsonSchema.boolean("Save a draft when true; defaults to false. Edit with update_document and publish with publish_document.", default: false),
            "content" => JsonSchema.string("The document body in plain text or markdown, including pipe tables."),
            "notify_person_ids" =>
              JsonSchema.array(
                JsonSchema.string("A person identifier."),
                description: "Optional people to notify about this document. Defaults to none beyond the author."
              ),
            "notify_everyone" =>
              JsonSchema.boolean(
                "When true, notify everyone eligible for this resource hub. Defaults to false."
              )
          },
          required: ["name", "content"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "resource_hub_id" => JsonSchema.string("The resolved resource hub identifier."),
            "document" => JsonSchema.any_object("The created document.")
          },
          required: ["resource_hub_id", "document"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, scope_inputs} <- Helpers.decode_hub_scope(arguments),
         {:ok, post_as_draft} <- OperatelyWeb.Mcp.CollaborationInputs.boolean(Map.get(arguments, "post_as_draft", false)),
         {:ok, folder_id} <- Helpers.decode_optional_id(arguments["folder_id"]),
         {:ok, content} <- Helpers.markdown_to_rich_text_allow_blank(arguments["content"]),
         {:ok, notification_inputs} <- Helpers.decode_notification_inputs(arguments) do
      DocumentCreate.call(
        conn,
        Map.merge(
          Map.merge(scope_inputs, %{
            folder_id: folder_id,
            name: arguments["name"],
            content: content,
            post_as_draft: post_as_draft
          }),
          notification_inputs
        )
      )
    end
  end
end
