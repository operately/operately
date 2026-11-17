defmodule OperatelyWeb.Mcp.Tools.Kpis.DeleteKpiEntry do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.DeleteKpiEntry, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_kpi_entry",
      title: "Delete KPI Entry",
      description: "Deletes a KPI measurement.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 275,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Delete KPI entry", "arguments" => %{"entry_id" => "entry_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "entry_id" => JsonSchema.string("The entry id.")
          },
          required: ["entry_id"]
        ),
      output_schema: JsonSchema.object(%{"entry" => JsonSchema.any_object()}, required: ["entry"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "entry_id", :entry_id, &Helpers.decode_id/1) do
      Api.call(conn, inputs)
    end
  end
end
