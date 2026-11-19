defmodule OperatelyWeb.Mcp.Tools.Kpis.EditKpiAnnotation do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.EditKpiAnnotation, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "edit_kpi_annotation",
      title: "Edit KPI Annotation",
      description: "Updates a KPI annotation. Omitted fields remain unchanged.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 277,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Edit KPI annotation", "arguments" => %{"annotation_id" => "annotation_123", "title" => "Pricing change"}}],
      input_schema:
        JsonSchema.object(
          %{
            "annotation_id" => JsonSchema.string("The annotation id."),
            "date" => JsonSchema.string("Calendar date in YYYY-MM-DD format.", format: "date"),
            "title" => JsonSchema.string("Annotation title.")
          },
          required: ["annotation_id"]
        ),
      output_schema: JsonSchema.object(%{"annotation" => JsonSchema.any_object()}, required: ["annotation"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "annotation_id", :annotation_id, &Helpers.decode_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "date", :date, &Helpers.parse_iso_date/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "title", :title, &{:ok, &1}) do
      Api.call(conn, inputs)
    end
  end
end
