defmodule OperatelyWeb.Mcp.Tools.Kpis.LogKpiEntry do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.LogKpiEntry, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "log_kpi_entry",
      title: "Log KPI Entry",
      description: "Records a KPI measurement for a calendar period.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 273,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Log KPI entry", "arguments" => %{"kpi_id" => "kpi_123", "value" => 75.5, "period" => "2026-02-01"}}],
      input_schema:
        JsonSchema.object(
          %{
            "kpi_id" => JsonSchema.string("The KPI id."),
            "value" => JsonSchema.number("The measured value."),
            "period" => JsonSchema.string("Calendar date in YYYY-MM-DD format.", format: "date")
          },
          required: ["kpi_id", "value", "period"]
        ),
      output_schema: JsonSchema.object(%{"entry" => JsonSchema.any_object()}, required: ["entry"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "kpi_id", :kpi_id, &Helpers.decode_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "value", :value, &{:ok, &1}),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "period", :period, &Helpers.parse_iso_date/1) do
      Api.call(conn, inputs)
    end
  end
end
