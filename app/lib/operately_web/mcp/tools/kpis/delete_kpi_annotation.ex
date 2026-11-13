defmodule OperatelyWeb.Mcp.Tools.Kpis.DeleteKpiAnnotation do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.DeleteKpiAnnotation, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_kpi_annotation",
      title: "Delete KPI Annotation",
      description: "Deletes a KPI annotation.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 278,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Delete KPI annotation", "arguments" => %{"annotation_id" => "annotation_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "annotation_id" => JsonSchema.string("The annotation id.")
          },
          required: ["annotation_id"]
        ),
      output_schema: JsonSchema.object(%{"annotation" => JsonSchema.any_object()}, required: ["annotation"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "annotation_id", :annotation_id, &Helpers.decode_id/1) do
      Api.call(conn, inputs)
    end
  end
end
