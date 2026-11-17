defmodule OperatelyWeb.Mcp.Tools.Kpis.GetKpi do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.GetKpi, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "get_kpi",
      title: "Get KPI",
      description: "Returns a KPI with measurement history, previous measurement values, and annotations.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 85,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Get KPI", "arguments" => %{"kpi_id" => "kpi_123"}}],
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
