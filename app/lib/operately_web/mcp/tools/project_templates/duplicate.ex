defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.Duplicate do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.Duplicate
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "duplicate_project_template",
      title: "Duplicate Project Template",
      description: "Duplicates a project template and all supported template content.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 233,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Duplicate Project Template",
          "arguments" => %{"template_id" => "project_template_123", "name" => "Launch copy"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "name" => JsonSchema.string("The duplicate template name.")
          },
          required: ["template_id", "name"]
        ),
      output_schema:
        JsonSchema.object(
          %{"template" => JsonSchema.any_object()},
          required: ["template"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, id} <- Helpers.decode_id(arguments["template_id"]) do
      conn
      |> Duplicate.call(%{id: id, name: arguments["name"]})
      |> Helpers.present_project_template_result()
    end
  end
end
