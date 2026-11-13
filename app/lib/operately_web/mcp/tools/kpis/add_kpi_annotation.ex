defmodule OperatelyWeb.Mcp.Tools.Kpis.AddKpiAnnotation do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.AddKpiAnnotation, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "add_kpi_annotation",
      title: "Add KPI Annotation",
      description: "Adds a dated annotation to a KPI chart.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 276,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Add KPI annotation", "arguments" => %{"kpi_id" => "kpi_123", "date" => "2026-02-01", "title" => "Revenue"}}],
      input_schema:
        JsonSchema.object(
          %{
            "kpi_id" => JsonSchema.string("The KPI id."),
            "date" => JsonSchema.string("Calendar date in YYYY-MM-DD format.", format: "date"),
            "title" => JsonSchema.string("Annotation title.")
          },
          required: ["kpi_id", "date", "title"]
        ),
      output_schema: JsonSchema.object(%{"annotation" => JsonSchema.any_object()}, required: ["annotation"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "kpi_id", :kpi_id, &Helpers.decode_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "date", :date, &Helpers.parse_iso_date/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "title", :title, &{:ok, &1}) do
      Api.call(conn, inputs)
    end
  end
end
