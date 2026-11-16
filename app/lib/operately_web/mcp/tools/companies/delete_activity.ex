defmodule OperatelyWeb.Mcp.Tools.Companies.DeleteActivity do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Companies.DeleteActivity, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_activity",
      title: "Delete Activity",
      description: "Permanently deletes an accessible activity from the connected company feed. Requires company admin or owner access. Does not undo the action recorded by the activity.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 215,
      annotations: destructive_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "companies"},
      examples: [%{"title" => "Delete Activity", "arguments" => %{"activity_id" => "activity_123"}}],
      input_schema: JsonSchema.object(%{"activity_id" => JsonSchema.string("The activity identifier.")}, required: ["activity_id"]),
      output_schema: JsonSchema.object(%{"success" => JsonSchema.boolean("Whether deletion succeeded.")}, required: ["success"])
    )
  end

  @impl true
  def call(conn, %{"activity_id" => id}) when is_binary(id) do
    with {:ok, id} <- Helpers.decode_id(id) do
      Api.call(conn, %{activity_id: id})
    end
  end

  def call(_conn, _arguments), do: {:error, :invalid_arguments}
end
