defmodule Operately.CompanyTransfers.Import.OrderingStateRewriter do
  @moduledoc """
  Rewrites known ordering and kanban state fields that store remapped IDs outside normal FKs.
  """

  alias Operately.CompanyTransfers.Import.TranslationPlan
  alias Operately.ShortUuid
  alias OperatelyWeb.Api.Helpers

  @registry %{
    "groups" => [
      %{column: "tasks_kanban_state", kind: :id_lists_by_key, table: "tasks"}
    ],
    "projects" => [
      %{column: "milestones_ordering_state", kind: :id_list, table: "project_milestones"},
      %{column: "tasks_kanban_state", kind: :id_lists_by_key, table: "tasks"}
    ],
    "project_milestones" => [
      %{column: "tasks_ordering_state", kind: :id_list, table: "tasks"},
      %{column: "tasks_kanban_state", kind: :id_lists_by_key, table: "tasks"}
    ]
  }

  @doc """
  Rewrites known ordering and kanban state fields for the given row.
  """
  def rewrite_row_fields(row, table, %TranslationPlan{} = plan) when is_map(row) and is_binary(table) do
    Enum.reduce(Map.get(@registry, table, []), row, fn config, acc ->
      rewrite_field(acc, config, plan)
    end)
    |> then(&{:ok, &1})
  end

  defp rewrite_field(row, %{column: column, kind: :id_list, table: table}, %TranslationPlan{} = plan) do
    case Map.get(row, column) do
      values when is_list(values) ->
        Map.put(row, column, rewrite_id_list(values, table, plan))

      _ ->
        row
    end
  end

  defp rewrite_field(row, %{column: column, kind: :id_lists_by_key, table: table}, %TranslationPlan{} = plan) do
    case Map.get(row, column) do
      value when is_map(value) ->
        rewritten =
          Enum.into(value, %{}, fn {key, ids} ->
            {key, rewrite_id_list(ids, table, plan)}
          end)

        Map.put(row, column, rewritten)

      _ ->
        row
    end
  end

  defp rewrite_id_list(values, table, %TranslationPlan{} = plan) when is_list(values) do
    Enum.flat_map(values, fn
      value when is_binary(value) ->
        case rewrite_id(value, table, plan) do
          {:ok, rewritten} -> [rewritten]
          :drop -> []
        end

      _ ->
        []
    end)
  end

  defp rewrite_id(value, table, %TranslationPlan{} = plan) do
    with {:ok, source_id} <- Helpers.decode_id(value),
         translated_id when is_binary(translated_id) <- TranslationPlan.translate(plan, table, source_id) do
      {:ok, reencode_like(value, translated_id)}
    else
      _ -> :drop
    end
  end

  defp reencode_like(value, translated_id) do
    short_id = ShortUuid.encode!(translated_id)
    original_short_id = Helpers.id_without_comments(value)

    case String.replace_suffix(value, "-" <> original_short_id, "") do
      ^value -> short_id
      "" -> short_id
      comments -> Helpers.id_with_comments(comments, short_id)
    end
  end
end
