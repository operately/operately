defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateContributor do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.UpdateContributor, as: ContributorUpdate
  alias OperatelyWeb.Mcp.Helpers

  @roles ~w(champion reviewer contributor)

  @impl true
  def definition do
    Definition.new!(
      name: "update_project_contributor",
      title: "Update Project Contributor",
      description: "Updates selected fields of a project contributor. Omitted fields remain unchanged.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 136,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Update contributor", "arguments" => %{"contributor_id" => "project_contributor_123", "responsibility" => "Product engineering", "access_level" => "edit_access"}}],
      input_schema:
        JsonSchema.object(
          %{
            "contributor_id" => JsonSchema.string("The project contributor identifier."),
            "person_id" => JsonSchema.nullable(JsonSchema.string("A replacement person identifier.")),
            "responsibility" => JsonSchema.nullable(JsonSchema.string("The responsibility. Null clears it.")),
            "access_level" => JsonSchema.nullable(JsonSchema.string("The contributor access level.", enum: Helpers.access_level_values())),
            "role" => JsonSchema.nullable(JsonSchema.string("The contributor role.", enum: @roles))
          },
          required: ["contributor_id"]
        ),
      output_schema: JsonSchema.object(%{"contributor" => JsonSchema.any_object()}, required: ["contributor"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, contributor_id} <- Helpers.decode_id(arguments["contributor_id"]),
         {:ok, inputs} <- Helpers.put_present(%{contrib_id: contributor_id}, arguments, "person_id", :person_id, &Helpers.decode_optional_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "responsibility", :responsibility),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "access_level", :permissions, &decode_optional_access/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "role", :role, &decode_optional_role/1) do
      ContributorUpdate.call(conn, inputs)
    end
  end

  defp decode_optional_access(nil), do: {:ok, nil}
  defp decode_optional_access(value), do: Helpers.decode_access_level(value)
  defp decode_optional_role(nil), do: {:ok, nil}
  defp decode_optional_role(role) when role in @roles, do: {:ok, String.to_atom(role)}
  defp decode_optional_role(_role), do: {:error, :invalid_arguments}
end
