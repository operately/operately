defmodule OperatelyWeb.Mcp.Tools.Kpis.EditKpiEntry do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.EditKpiEntry, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "edit_kpi_entry",
      title: "Edit KPI Entry",
      description: "Corrects a KPI measurement, preserving its edit history. Omitted fields remain unchanged.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 274,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Edit KPI entry", "arguments" => %{"entry_id" => "entry_123", "value" => 82.5}}],
      input_schema:
        JsonSchema.object(
          %{
            "entry_id" => JsonSchema.string("The entry id."),
            "value" => JsonSchema.number("The measured value."),
            "period" => JsonSchema.string("Calendar date in YYYY-MM-DD format.", format: "date")
          },
          required: ["entry_id"]
        ),
      output_schema: JsonSchema.object(%{"entry" => JsonSchema.any_object()}, required: ["entry"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "entry_id", :entry_id, &Helpers.decode_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "value", :value, &{:ok, &1}),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "period", :period, &Helpers.parse_iso_date/1) do
      Api.call(conn, inputs)
    end
  end
end
