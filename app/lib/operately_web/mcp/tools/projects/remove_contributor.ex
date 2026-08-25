defmodule OperatelyWeb.Mcp.Tools.Projects.RemoveContributor do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Projects.DeleteContributor
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "remove_project_contributor",
      title: "Remove Project Contributor",
      description: "Removes a contributor from a project.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 227,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "projects"},
      examples: [%{"title" => "Remove contributor", "arguments" => %{"contributor_id" => "project_contributor_123"}}],
      input_schema: JsonSchema.object(%{"contributor_id" => JsonSchema.string("The project contributor identifier.")}, required: ["contributor_id"]),
      output_schema: JsonSchema.object(%{"contributor" => JsonSchema.any_object("The removed contributor.")}, required: ["contributor"])
    )
  end

  @impl true
  def call(conn, %{"contributor_id" => contributor_id}) do
    with {:ok, _decoded_id} <- Helpers.decode_id(contributor_id) do
      DeleteContributor.call(conn, %{contrib_id: contributor_id})
    end
  end
end
