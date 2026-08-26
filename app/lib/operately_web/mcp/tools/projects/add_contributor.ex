defmodule OperatelyWeb.Mcp.Tools.Projects.AddContributor do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.CreateContributor
  alias OperatelyWeb.Mcp.Helpers

  @roles ~w(champion reviewer contributor)

  @impl true
  def definition do
    Definition.new!(
      name: "add_project_contributor",
      title: "Add Project Contributor",
      description: "Adds a person as a contributor on an active project with a role and access level. For blueprint staffing on a project template, use add_project_template_contributor.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 135,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [
        %{
          "title" => "Add contributor",
          "arguments" => %{"project_id" => "project_123", "person_id" => "person_123", "responsibility" => "Engineering", "access_level" => "edit_access", "role" => "contributor"}
        }
      ],
      input_schema:
        JsonSchema.object(
          %{
            "project_id" => JsonSchema.string("The project identifier."),
            "person_id" => JsonSchema.string("The person identifier."),
            "responsibility" => JsonSchema.string("The contributor's responsibility."),
            "access_level" => JsonSchema.string("The contributor access level.", enum: Helpers.access_level_values()),
            "role" => JsonSchema.string("The contributor role.", enum: @roles)
          },
          required: ["project_id", "person_id", "responsibility", "access_level", "role"]
        ),
      output_schema: JsonSchema.object(%{"project_contributor" => JsonSchema.any_object()}, required: ["project_contributor"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, project_id} <- Helpers.decode_id(arguments["project_id"]),
         {:ok, person_id} <- Helpers.decode_id(arguments["person_id"]),
         {:ok, permissions} <- Helpers.decode_access_level(arguments["access_level"]),
         {:ok, role} <- decode_role(arguments["role"]) do
      CreateContributor.call(conn, %{project_id: project_id, person_id: person_id, responsibility: arguments["responsibility"], permissions: permissions, role: role})
    end
  end

  defp decode_role(role) when role in @roles, do: {:ok, String.to_atom(role)}
  defp decode_role(_role), do: {:error, :invalid_arguments}
end
