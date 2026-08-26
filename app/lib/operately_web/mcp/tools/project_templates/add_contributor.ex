defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.AddContributor do
  use OperatelyWeb.Mcp.Tool

  alias Operately.Access.Binding
  alias OperatelyWeb.Api.ProjectTemplates.CreatePerson
  alias OperatelyWeb.Mcp.Helpers

  @roles ~w(champion reviewer contributor)

  @impl true
  def definition do
    Definition.new!(
      name: "add_project_template_contributor",
      title: "Add Project Template Contributor",
      description: "Adds a company person as blueprint staffing on a project template with an explicit role and access level. For people on an active project, use add_project_contributor.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 246,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Add Project Template Contributor",
          "arguments" => %{
            "template_id" => "project_template_123",
            "person_id" => "person_123",
            "role" => "contributor",
            "access_level" => "edit_access"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "person_id" => JsonSchema.string("The company person to add as a template contributor."),
            "role" => JsonSchema.string("The template contributor role.", enum: @roles),
            "responsibility" => JsonSchema.nullable(JsonSchema.string("Optional responsibility.")),
            "access_level" => JsonSchema.string("The template contributor access level.", enum: Helpers.access_level_values())
          },
          required: ["template_id", "person_id", "role", "access_level"]
        ),
      output_schema: JsonSchema.object(%{"contributor" => JsonSchema.any_object()}, required: ["contributor"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, person_id} <- Helpers.decode_id(arguments["person_id"]),
         {:ok, role} <- Helpers.decode_enum(arguments["role"], @roles),
         {:ok, access_level} <- decode_access_level(arguments["access_level"]),
         {:ok, %{person: contributor}} <-
           CreatePerson.call(conn, %{
             template_id: template_id,
             person_id: person_id,
             role: role,
             responsibility: arguments["responsibility"],
             access_level: access_level
           }) do
      {:ok, %{contributor: contributor}}
    end
  end

  defp decode_access_level(value) do
    with {:ok, level} <- Helpers.decode_access_level(value) do
      {:ok, Binding.from_atom(level)}
    end
  end
end
