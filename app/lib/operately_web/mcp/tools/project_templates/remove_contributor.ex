defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.RemoveContributor do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.DeletePerson
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "remove_project_template_contributor",
      title: "Remove Project Template Contributor",
      description: "Removes a contributor and their template task assignments from a project template.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 248,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Remove Project Template Contributor",
          "arguments" => %{"template_id" => "project_template_123", "contributor_id" => "contributor_123"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "contributor_id" => JsonSchema.string("The template contributor identifier.")
          },
          required: ["template_id", "contributor_id"]
        ),
      output_schema:
        JsonSchema.object(
          %{"success" => JsonSchema.boolean("Whether the contributor was removed.")},
          required: ["success"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, template_person_id} <- Helpers.decode_id(arguments["contributor_id"]) do
      DeletePerson.call(conn, %{template_id: template_id, template_person_id: template_person_id})
    end
  end
end
