defmodule OperatelyWeb.Mcp.Tools.Companies.ListActivities do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Companies.ListActivities, as: Api
  alias OperatelyWeb.Mcp.Helpers
  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  @scope_types ~w(company person space project milestone task goal)

  @impl true
  def definition do
    Definition.new!(
      name: "list_activities",
      title: "List Activities",
      description:
        "Returns a page of up to 20 accessible activities, newest first, in the connected company. Omit scope_type and scope_id for the company feed. Pass next_cursor as cursor to read older activities.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 99,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "companies"},
      examples: [%{"title" => "List Activities", "arguments" => %{}}],
      input_schema:
        JsonSchema.object(
          %{
            "scope_type" => JsonSchema.string("Scope to filter; defaults to company.", enum: @scope_types),
            "scope_id" => JsonSchema.string("Required for a non-company scope; omit for company."),
            "actions" => JsonSchema.array(JsonSchema.string("Activity action name."), description: "Optional action names; omit for all supported actions."),
            "cursor" => JsonSchema.string("Opaque next_cursor from a previous page.")
          },
          required: []
        ),
      output_schema:
        JsonSchema.object(
          %{"activities" => JsonSchema.array(JsonSchema.any_object()), "next_cursor" => JsonSchema.nullable(JsonSchema.string("Cursor for older activities, or null on the last page."))},
          required: ["activities", "next_cursor"]
        )
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, scope_type} <- Helpers.decode_enum(Map.get(arguments, "scope_type", "company"), @scope_types),
         {:ok, scope_id} <- decode_scope_id(conn, scope_type, arguments["scope_id"]),
         {:ok, actions} <- decode_actions(Map.get(arguments, "actions", [])),
         {:ok, inputs} <- Helpers.put_present(%{scope_type: scope_type, scope_id: scope_id, actions: actions, paginate: true}, arguments, "cursor", :cursor, &Inputs.string/1) do
      Api.call(conn, inputs)
    end
  end

  defp decode_scope_id(conn, :company, nil), do: {:ok, OperatelyWeb.Paths.company_id(conn.assigns.current_company)}
  defp decode_scope_id(_conn, :company, _id), do: {:error, :invalid_arguments}

  defp decode_scope_id(_conn, _type, id) when is_binary(id) do
    # This endpoint decodes its string scope_id itself. Validate before forwarding.
    with {:ok, _} <- Helpers.decode_id(id), do: {:ok, id}
  end

  defp decode_scope_id(_conn, _type, _id), do: {:error, :invalid_arguments}

  defp decode_actions(actions) when is_list(actions) do
    if Enum.all?(actions, &is_binary/1), do: {:ok, actions}, else: {:error, :invalid_arguments}
  end

  defp decode_actions(_), do: {:error, :invalid_arguments}
end
