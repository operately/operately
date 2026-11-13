defmodule OperatelyWeb.Mcp.Tools.Kpis.ListKpis do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Kpis.ListKpis, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "list_kpis",
      title: "List KPIs",
      description: "Lists KPIs in a space with recent measurements.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 84,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "kpis"},
      examples: [%{"title" => "List KPIs", "arguments" => %{"space_id" => "space_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("The space id.")
          },
          required: ["space_id"]
        ),
      output_schema: JsonSchema.object(%{"kpis" => JsonSchema.array(JsonSchema.any_object())}, required: ["kpis"])
    )
  end

  @impl true
  def call(conn, arguments) do
    inputs = %{}

    with {:ok, inputs} <- Helpers.put_present(inputs, arguments, "space_id", :space_id, &Helpers.decode_id/1) do
      Api.call(conn, inputs)
    end
  end
end
