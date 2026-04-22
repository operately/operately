defmodule Operately.CompanyTransfers.Import.RichTextRewriter do
  @moduledoc """
  During import, scans top-level TipTap documents stored in schema-backed map fields,
  finds blob and person references inside them, and replaces each source ID with the
  destination ID generated for the imported company.
  """

  alias Operately.Blobs.Blob
  alias Operately.CompanyTransfers.Import.TranslationPlan
  alias Operately.RichContent
  alias Operately.ShortUuid
  alias OperatelyWeb.Api.Helpers

  @doc """
  Rewrites blob and person IDs in any precomputed schema-backed `:map` field whose value
  is a top-level TipTap document.
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
    case rewrite_references(value, table, field, plan) do
      {:ok, rewritten} ->
        {:cont, {:ok, Map.put(row, field, rewritten)}}

      {:error, _reason} = error ->
        {:halt, error}
    end
  end

  defp rewrite_references(value, table, field, %TranslationPlan{} = plan) when is_list(value) do
    Enum.reduce_while(value, {:ok, []}, fn item, {:ok, acc} ->
      case rewrite_references(item, table, field, plan) do
        {:ok, rewritten} -> {:cont, {:ok, [rewritten | acc]}}
        {:error, _reason} = error -> {:halt, error}
      end
    end)
    |> then(fn
      {:ok, rewritten} -> {:ok, Enum.reverse(rewritten)}
      {:error, _reason} = error -> error
    end)
  end

  defp rewrite_references(%{"type" => "mention", "attrs" => attrs} = node, table, field, %TranslationPlan{} = plan) when is_map(attrs) do
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

  defp rewrite_references(%{"type" => "blob", "attrs" => attrs} = node, table, field, %TranslationPlan{} = plan) when is_map(attrs) do
    case RichContent.Blob.find_ids(node) do
      [source_blob_id | _] ->
        case TranslationPlan.translate(plan, "blobs", source_blob_id) do
          nil ->
            {:error, {:missing_rich_text_blob_translation, table, field, source_blob_id}}

          translated_blob_id ->
            {:ok, put_in(node, ["attrs"], rewrite_blob_attrs(attrs, translated_blob_id))}
        end

      [] ->
        {:ok, node}
    end
  end

  defp rewrite_references(value, table, field, %TranslationPlan{} = plan) when is_map(value) do
    Enum.reduce_while(value, {:ok, %{}}, fn {key, nested_value}, {:ok, acc} ->
      case rewrite_references(nested_value, table, field, plan) do
        {:ok, rewritten} -> {:cont, {:ok, Map.put(acc, key, rewritten)}}
        {:error, _reason} = error -> {:halt, error}
      end
    end)
  end

  defp rewrite_references(value, _table, _field, _plan), do: {:ok, value}

  defp encode_mention_id(person_id, label) do
    short_id = ShortUuid.encode!(person_id)

    case label do
      label when is_binary(label) and label != "" -> Helpers.id_with_comments(label, short_id)
      _ -> short_id
    end
  end

  defp rewrite_blob_attrs(attrs, translated_blob_id) do
    attrs
    |> rewrite_blob_attr_id(translated_blob_id)
    |> rewrite_blob_attr_src(translated_blob_id)
  end

  defp rewrite_blob_attr_id(attrs, translated_blob_id) do
    if is_binary(attrs["id"]) do
      Map.put(attrs, "id", ShortUuid.encode!(translated_blob_id))
    else
      attrs
    end
  end

  defp rewrite_blob_attr_src(%{"src" => %{"id" => _id} = src} = attrs, translated_blob_id) do
    updated_src =
      src
      |> Map.put("id", translated_blob_id)
      |> Map.put("url", Blob.url(%Blob{id: translated_blob_id}))

    Map.put(attrs, "src", updated_src)
  end

  defp rewrite_blob_attr_src(%{"src" => src} = attrs, translated_blob_id) when is_binary(src) do
    case String.split(src, "/blobs/", parts: 2) do
      [prefix, _rest] -> Map.put(attrs, "src", prefix <> "/blobs/" <> translated_blob_id)
      _ -> attrs
    end
  end

  defp rewrite_blob_attr_src(attrs, _translated_blob_id), do: attrs
end
