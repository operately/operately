defmodule OperatelyWeb.Mcp.Tools.SearchFullText do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Companies.Search, as: CompanySearch
  alias OperatelyWeb.Mcp.Helpers

  @result_types ~w(resource_hub_folder resource_hub_document resource_hub_file resource_hub_link project goal milestone task person discussion project_check_in goal_check_in project_retrospective)
  @time_ranges ~w(last_7_days last_30_days last_90_days last_12_months)
  @sorts ~w(best_match most_recent)

  @impl true
  def definition do
    Definition.new!(
      name: "search_full_text",
      title: "Full-text Search",
      description: "Searches company content with optional space, content-type, time-range, and sorting filters.",
      company_mode: :authenticated,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 91,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{"category" => "search"},
      examples: [%{"title" => "Search recent projects", "arguments" => %{"query" => "launch", "types" => ["project"], "time_range" => "last_90_days"}}],
      input_schema:
        JsonSchema.object(
          %{
            "query" => JsonSchema.string("The full-text query."),
            "space_ids" => JsonSchema.array(JsonSchema.string("A space identifier.")),
            "types" => JsonSchema.array(JsonSchema.string("A result type.", enum: @result_types)),
            "time_range" => JsonSchema.string("Optional time range.", enum: @time_ranges),
            "sort" => JsonSchema.string("Result ordering.", enum: @sorts)
          },
          required: ["query"]
        ),
      output_schema: JsonSchema.object(%{"results" => JsonSchema.array(JsonSchema.any_object())}, required: ["results"])
    )
  end

  @impl true
  def call(conn, arguments) do
    with {:ok, space_ids} <- decode_optional_ids(arguments),
         {:ok, types} <- decode_optional_enum_list(arguments["types"], @result_types),
         {:ok, time_range} <- decode_optional_enum(arguments["time_range"], @time_ranges),
         {:ok, sort} <- decode_optional_enum(arguments["sort"], @sorts) do
      inputs =
        %{query: arguments["query"]}
        |> Helpers.put_optional(:space_ids, space_ids)
        |> Helpers.put_optional(:types, types)
        |> Helpers.put_optional(:time_range, time_range)
        |> Helpers.put_optional(:sort, sort)

      CompanySearch.call(conn, inputs)
    end
  end

  defp decode_optional_ids(arguments) do
    if Map.has_key?(arguments, "space_ids"), do: Helpers.decode_id_list(arguments["space_ids"]), else: {:ok, nil}
  end

  defp decode_optional_enum(nil, _allowed), do: {:ok, nil}

  defp decode_optional_enum(value, allowed) when is_binary(value) do
    if value in allowed, do: {:ok, String.to_atom(value)}, else: {:error, :invalid_arguments}
  end

  defp decode_optional_enum(_value, _allowed), do: {:error, :invalid_arguments}

  defp decode_optional_enum_list(nil, _allowed), do: {:ok, nil}

  defp decode_optional_enum_list(values, allowed) when is_list(values) do
    if Enum.all?(values, &(&1 in allowed)), do: {:ok, Enum.map(values, &String.to_atom/1)}, else: {:error, :invalid_arguments}
  end

  defp decode_optional_enum_list(_values, _allowed), do: {:error, :invalid_arguments}
end
