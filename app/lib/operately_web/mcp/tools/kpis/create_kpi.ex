defmodule OperatelyWeb.Mcp.Tools.Kpis.CreateKpi do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.CreateKpi, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "create_kpi",
      title: "Create KPI",
      description: "Creates a KPI in a space with weekly or monthly measurements.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 270,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "Create KPI", "arguments" => %{"space_id" => "space_123", "name" => "Revenue", "unit" => "USD", "cadence" => "monthly"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The space id."),
            "name" => JsonSchema.string("KPI name."),
            "unit" => JsonSchema.string("Measurement unit, such as USD or percent."),
            "cadence" => JsonSchema.string("Measurement cadence.", enum: ["weekly", "monthly"]),
            "champion_id" => JsonSchema.nullable(JsonSchema.string("The champion id.")),
            "description" => JsonSchema.nullable(JsonSchema.string("Optional description in Markdown."))
          },
          required: ["space_id", "name", "unit", "cadence"]
        ),
      output_schema: JsonSchema.object(%{"kpi" => JsonSchema.any_object()}, required: ["kpi"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "space_id", :space_id, &Helpers.decode_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "name", :name, &{:ok, &1}),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "unit", :unit, &{:ok, &1}),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "cadence", :cadence, &Helpers.decode_enum(&1, ["weekly", "monthly"])),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "champion_id", :champion_id, &Helpers.decode_optional_id/1),
         {:ok, inputs} <- Helpers.put_present(inputs, arguments, "description", :description, &Helpers.markdown_to_rich_text_nullable/1) do
      Api.call(conn, inputs)
    end
  end
end
