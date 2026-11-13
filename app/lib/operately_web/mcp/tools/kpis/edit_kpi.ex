defmodule OperatelyWeb.Mcp.Tools.Kpis.EditKpi do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.EditKpi, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "edit_kpi",
      title: "Edit KPI",
      description: "Updates KPI settings. Omitted fields remain unchanged; null clears the champion or description.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 271,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Edit KPI", "arguments" => %{"kpi_id" => "kpi_123", "name" => "Monthly revenue"}}],
      input_schema:
        JsonSchema.object(
          %{
            "kpi_id" => JsonSchema.string("The KPI id."),
            "name" => JsonSchema.string("KPI name."),
            "unit" => JsonSchema.string("Measurement unit, such as USD or percent."),
            "cadence" => JsonSchema.string("Measurement cadence.", enum: ["weekly", "monthly"]),
            "champion_id" => JsonSchema.nullable(JsonSchema.string("The champion id.")),
            "description" => JsonSchema.nullable(JsonSchema.string("Description in Markdown. Omit to preserve; null clears it."))
          },
          required: ["kpi_id"]
        ),
      output_schema: JsonSchema.object(%{"kpi" => JsonSchema.any_object()}, required: ["kpi"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "kpi_id", :kpi_id, &Helpers.decode_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "name", :name, &{:ok, &1}),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "unit", :unit, &{:ok, &1}),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "cadence", :cadence, &Helpers.decode_enum(&1, ["weekly", "monthly"])),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "champion_id", :champion_id, &Helpers.decode_optional_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "description", :description, &Helpers.markdown_to_rich_text_nullable/1) do
      Api.call(conn, inputs)
    end
  end
end
