defmodule OperatelyWeb.Mcp.Tools.Spaces.RemoveSpaceMember do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Spaces.DeleteMember, as: Api
  alias OperatelyWeb.Mcp.Helpers

  @impl true
  def definition do
    Definition.new!(
      name: "remove_space_member",
      title: "Remove Space Member",
      description: "Removes direct resource membership. Inherited access may remain. Requires full access.",
      company_mode: :resource_derived,
      required_scopes: ["mcp:write"],
      safety_classification: :destructive,
      sort_order: 210,
      annotations: destructive_annotations(),
      security_schemes: write_security_schemes(),
      discovery_metadata: %{"category" => "spaces"},
      examples: [%{"title" => "Remove space member", "arguments" => %{"space_id" => "space_123", "member_id" => "member_123"}}],
      input_schema:
        JsonSchema.object(
          %{
            "space_id" => JsonSchema.string("Space id."),
            "member_id" => JsonSchema.string("Member id.")
          },
          required: ["space_id", "member_id"]
        ),
      output_schema: JsonSchema.object(%{}, required: [])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, inputs} <- decode_inputs(arguments), do: Api.call(conn, inputs)
  end

  defp decode_inputs(arguments) do
    with {:ok, space_id} <- Helpers.decode_id(arguments["space_id"]),
         {:ok, member_id} <- Helpers.decode_id(arguments["member_id"]) do
      {:ok, %{space_id: space_id, member_id: member_id}}
    end
  end
end
