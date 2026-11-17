defmodule OperatelyWeb.Mcp.Tools.Spaces.JoinSpace do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.Join, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "join_space",
      title: "Join Space",
      description: "Joins an accessible space as the connected member.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :write,
      sort_order: 210,
      annotations: write_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Join space", "arguments" => %{"space_id" => "space_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("Space id.")
          },
          required: ["space_id"]
        ),
      output_schema: JsonSchema.object(%{}, required: [])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]) do
      {:ok, %{space_id: space_id}}
    end
  end
end
