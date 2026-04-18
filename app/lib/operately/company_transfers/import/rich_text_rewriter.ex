defmodule Operately.CompanyTransfers.Import.RichTextRewriter do
  @moduledoc """
  During import, scans top-level TipTap documents stored in schema-backed map fields,
  finds person mentions, and replaces each source person ID with the destination person
  ID generated for the imported company.
  """

  alias Operately.CompanyTransfers.Import.TranslationPlan
  alias Operately.RichContent
  alias Operately.ShortUuid
  alias OperatelyWeb.Api.Helpers

  @doc """
  Rewrites person mention IDs in any precomputed schema-backed `:map` field whose value
  is a top-level TipTap document.

  Each mention ID is decoded, translated through the import `TranslationPlan` for the
  `people` table, and written back using the app's normal encoded mention ID format.
  """
  def rewrite_row_mentions(row, table, %TranslationPlan{} = plan, map_fields) when is_map(row) and is_binary(table) and is_list(map_fields) do
    Enum.reduce_while(map_fields, {:ok, row}, fn field, {:ok, acc_row} ->
      rewrite_map_field(acc_row, field, table, plan)
    end)
  end

  defp rewrite_map_field(row, field, table, %TranslationPlan{} = plan) do
    value = Map.get(row, field)

    cond do
      not is_map(value) ->
        {:cont, {:ok, row}}

      not RichContent.tiptap_document?(value) ->
        {:cont, {:ok, row}}

      true ->
        apply_rewritten_field(row, field, value, table, plan)
    end
  end

  defp apply_rewritten_field(row, field, value, table, %TranslationPlan{} = plan) do
    case rewrite_mentions(value, table, field, plan) do
      {:ok, rewritten} ->
        {:cont, {:ok, Map.put(row, field, rewritten)}}

      {:error, _reason} = error ->
        {:halt, error}
    end
  end

  defp rewrite_mentions(value, table, field, %TranslationPlan{} = plan) when is_list(value) do
    Enum.reduce_while(value, {:ok, []}, fn item, {:ok, acc} ->
      case rewrite_mentions(item, table, field, plan) do
        {:ok, rewritten} -> {:cont, {:ok, [rewritten | acc]}}
        {:error, _reason} = error -> {:halt, error}
      end
    end)
    |> then(fn
      {:ok, rewritten} -> {:ok, Enum.reverse(rewritten)}
      {:error, _reason} = error -> error
    end)
  end

  defp rewrite_mentions(%{"type" => "mention", "attrs" => attrs} = node, table, field, %TranslationPlan{} = plan) when is_map(attrs) do
    case Map.get(attrs, "id") do
      id when is_binary(id) ->
        case Helpers.decode_id(id) do
          {:ok, source_person_id} ->
            case TranslationPlan.translate(plan, "people", source_person_id) do
              nil ->
                {:error, {:missing_rich_text_mention_translation, table, field, source_person_id}}

              translated_person_id ->
                {:ok, put_in(node, ["attrs", "id"], encode_mention_id(translated_person_id, attrs["label"]))}
            end

          _ ->
            {:ok, node}
        end

      _ ->
        {:ok, node}
    end
  end

  defp rewrite_mentions(value, table, field, %TranslationPlan{} = plan) when is_map(value) do
    Enum.reduce_while(value, {:ok, %{}}, fn {key, nested_value}, {:ok, acc} ->
      case rewrite_mentions(nested_value, table, field, plan) do
        {:ok, rewritten} -> {:cont, {:ok, Map.put(acc, key, rewritten)}}
        {:error, _reason} = error -> {:halt, error}
      end
    end)
  end

  defp rewrite_mentions(value, _table, _field, _plan), do: {:ok, value}

  defp encode_mention_id(person_id, label) do
    short_id = ShortUuid.encode!(person_id)

    case label do
      label when is_binary(label) and label != "" -> Helpers.id_with_comments(label, short_id)
      _ -> short_id
    end
  end
end
