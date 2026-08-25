defmodule OperatelyWeb.Mcp.Tools.ProjectTemplates.List do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.ProjectTemplates.List, as: TemplateList
  alias OperatelyWeb.Mcp.Helpers

  @archive_statuses ~w(active archived all)

  @impl true
  def definition do
    Definition.new!(
      name: "list_project_templates",
      title: "List Project Templates",
      description: "Lists accessible project templates, optionally filtered by space, text, or archive status.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 101,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "project_templates"},
      examples: [%{"title" => "List Project Templates", "arguments" => %{"archive_status" => "active"}}],
      input_schema:
        JsonSchema.object(%{
          "space_id" => JsonSchema.string("Optional space identifier."),
          "search" => JsonSchema.string("Optional name or description search."),
          "archive_status" => JsonSchema.string("Archive filter.", enum: @archive_statuses)
        }),
      output_schema:
        JsonSchema.object(
          %{"templates" => JsonSchema.array(JsonSchema.any_object())},
          required: ["templates"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_id} <- Helpers.decode_optional_id(arguments["space_id"]),
         {:ok, archive_status} <- decode_archive_status(arguments["archive_status"]) do
      inputs = %{space_id: space_id, search: arguments["search"] || "", archive_status: archive_status || :active}

      conn
      |> TemplateList.call(inputs)
      |> Helpers.present_project_template_result()
    end
  end

  defp decode_archive_status(nil), do: {:ok, nil}
  defp decode_archive_status(value) when value in @archive_statuses, do: {:ok, String.to_atom(value)}
  defp decode_archive_status(_value), do: {:error, :invalid_arguments}
end
