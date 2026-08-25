defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.UpdateContributor do
  use OperatelyWeb.Mcp.Tool

  alias Operately.Access.Binding
  alias OperatelyWeb.Api.ProjectTemplates.UpdatePerson, as: PersonUpdate
  alias OperatelyWeb.Mcp.Helpers

  @roles ~w(champion reviewer contributor)

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_template_contributor",
      title: "Update Project Template Contributor",
      description: "Updates selected template-contributor fields. Omitted fields remain unchanged; null clears responsibility.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 247,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [
        %{
          "title" => "Update Project Template Contributor",
          "arguments" => %{
            "template_id" => "project_template_123",
            "contributor_id" => "contributor_123",
            "responsibility" => "Engineering"
          }
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "template_id" => JsonSchema.string("The project template identifier."),
            "contributor_id" => JsonSchema.string("The template contributor identifier."),
            "person_id" => JsonSchema.nullable(JsonSchema.string("A replacement company person identifier.")),
            "role" => JsonSchema.nullable(JsonSchema.string("The template contributor role.", enum: @roles)),
            "responsibility" => JsonSchema.nullable(JsonSchema.string("Responsibility; null clears it.")),
            "access_level" => JsonSchema.nullable(JsonSchema.string("The template contributor access level.", enum: Helpers.access_level_values()))
          },
          required: ["template_id", "contributor_id"]
        ),
      output_schema: JsonSchema.object(%{"contributor" => JsonSchema.any_object()}, required: ["contributor"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, template_id} <- Helpers.decode_id(arguments["template_id"]),
         {:ok, template_person_id} <- Helpers.decode_id(arguments["contributor_id"]),
         {:ok, inputs} <-
           Helpers.put_present(
             %{template_id: template_id, template_person_id: template_person_id},
             arguments,
             "person_id",
             :person_id,
             &Helpers.decode_optional_id/1
           ),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "role", :role, &Helpers.decode_optional_enum(&1, @roles)),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "responsibility", :responsibility),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "access_level", :access_level, &decode_optional_access/1),
         {:ok, %{person: contributor}} <- PersonUpdate.call(conn, inputs) do
      {:ok, %{contributor: contributor}}
    end
  end

  defp decode_optional_access(nil), do: {:ok, nil}

  defp decode_optional_access(value) do
    with {:ok, level} <- Helpers.decode_access_level(value) do
      {:ok, Binding.from_atom(level)}
    end
  end
end
