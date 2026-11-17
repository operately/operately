defmodule OperatelyWeb.Mcp.Tools.Kpis.DeleteKpi do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.DeleteKpi, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "delete_kpi",
      title: "Delete KPI",
      description: "Deletes a KPI and its measurements and annotations.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 272,
      annotations: destructive_annotations(),
      security_schemes: destructive_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Delete KPI", "arguments" => %{"kpi_id" => "kpi_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "kpi_id" => JsonSchema.string("The KPI id.")
          },
          required: ["kpi_id"]
        ),
      output_schema: JsonSchema.object(%{"kpi" => JsonSchema.any_object()}, required: ["kpi"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "kpi_id", :kpi_id, &Helpers.decode_id/1) do
      Api.call(conn, inputs)
    end
  end
end
