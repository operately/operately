defmodule Operately.CompanyTransfers.Import.ActivityContentRewriter do
  @moduledoc """
  Rewrites IDs inside `activities.content` during import.

  Missing translations are tolerated here and the original stored value is kept.
  """

  alias Operately.Activities
  alias Operately.CompanyTransfers.Import.TranslationPlan

  @override_registry %{
    "company_admin_added" => [
      %{path: ["people", :all, "id"], table: "people"}
    ],
    "space_members_added" => [
      %{path: ["members", :all, "person_id"], table: "people"}
    ],
    "space_members_permissions_edited" => [
      %{path: ["members", :all, "person_id"], table: "people"}
    ],
    "goal_editing" => [
      %{path: ["added_targets", :all, "id"], table: "targets"},
      %{path: ["updated_targets", :all, "id"], table: "targets"},
      %{path: ["deleted_targets", :all, "id"], table: "targets"}
    ],
    "project_timeline_edited" => [
      %{path: ["milestone_updates", :all, "milestone_id"], table: "project_milestones"},
      %{path: ["new_milestones", :all, "milestone_id"], table: "project_milestones"}
    ],
    "company_owners_adding" => [
      %{path: ["company_id"], table: "companies"}
    ],
    "company_editing" => [
      %{path: ["company_id"], table: "companies"}
    ],
    "company_members_permissions_edited" => [
      %{path: ["company_id"], table: "companies"}
    ],
    "resource_hub_parent_folder_edited" => [
      %{
        path: ["resource_id"],
        type_path: ["resource_type"],
        table_map: %{
          "document" => "resource_documents",
          "file" => "resource_files",
          "folder" => "resource_folders",
          "link" => "resource_links"
        }
      }
    ]
  }

  @doc """
  Rewrites IDs in `activities.content` using the current activity content schema.
  """
  def rewrite_row_content(row, "activities", %TranslationPlan{} = plan) when is_map(row) do
    with action when is_binary(action) <- row["action"],
         content when is_map(content) <- row["content"] do
      content =
        content
        |> translate_schema_fields(action, plan)
        |> apply_overrides(action, plan)

      {:ok, Map.put(row, "content", content)}
    else
      _ -> {:ok, row}
    end
  end

  def rewrite_row_content(row, _table, %TranslationPlan{}), do: {:ok, row}

  defp translate_schema_fields(content, action, %TranslationPlan{} = plan) do
    case Activities.content_module(action) do
      nil -> content
      module -> translate_content(content, module, plan)
    end
  end

  defp translate_content(content, module, %TranslationPlan{} = plan) when is_map(content) do
    content
    |> translate_association_ids(module, plan)
    |> translate_embeds(module, plan)
  end

  defp translate_content(content, _module, %TranslationPlan{}), do: content

  defp translate_association_ids(content, module, %TranslationPlan{} = plan) do
    Enum.reduce(module.__schema__(:associations), content, fn association_name, acc ->
      association = module.__schema__(:association, association_name)
      owner_key = to_string(association.owner_key)

      case {Map.get(acc, owner_key), related_table(association)} do
        {source_id, table} when is_binary(source_id) and is_binary(table) ->
          maybe_put_translation(acc, owner_key, table, source_id, plan)

        _ ->
          acc
      end
    end)
  end

  defp translate_embeds(content, module, %TranslationPlan{} = plan) do
    Enum.reduce(module.__schema__(:embeds), content, fn embed_name, acc ->
      key = to_string(embed_name)
      embed = module.__schema__(:embed, embed_name)

      case Map.fetch(acc, key) do
        {:ok, value} ->
          Map.put(acc, key, translate_embed_value(value, embed, plan))

        :error ->
          acc
      end
    end)
  end

  defp translate_embed_value(value, %{cardinality: :many, related: related}, %TranslationPlan{} = plan) when is_list(value) do
    Enum.map(value, &translate_content(&1, related, plan))
  end

  defp translate_embed_value(value, %{related: related}, %TranslationPlan{} = plan) when is_map(value) do
    translate_content(value, related, plan)
  end

  defp translate_embed_value(value, _embed, %TranslationPlan{}), do: value

  defp related_table(%{related: related}) do
    if function_exported?(related, :__schema__, 1) do
      related.__schema__(:source)
    end
  end

  defp apply_overrides(content, action, %TranslationPlan{} = plan) do
    Enum.reduce(Map.get(@override_registry, action, []), content, fn override, acc ->
      rewrite_override(acc, override.path, override, plan)
    end)
  end

  defp rewrite_override(value, [:all | rest], override, %TranslationPlan{} = plan) when is_list(value) do
    Enum.map(value, &rewrite_override(&1, rest, override, plan))
  end

  defp rewrite_override(value, [key], override, %TranslationPlan{} = plan) when is_map(value) do
    case Map.get(value, key) do
      source_id when is_binary(source_id) ->
        case translate_override_value(source_id, value, override, plan) do
          {:replace, translated_id} -> Map.put(value, key, translated_id)
          :keep -> value
        end

      _ ->
        value
    end
  end

  defp rewrite_override(value, [key | rest], override, %TranslationPlan{} = plan) when is_map(value) do
    case Map.fetch(value, key) do
      {:ok, nested_value} ->
        Map.put(value, key, rewrite_override(nested_value, rest, override, plan))

      :error ->
        value
    end
  end

  defp rewrite_override(value, _path, _override, %TranslationPlan{}), do: value

  defp translate_override_value(source_id, _current, %{table: table}, %TranslationPlan{} = plan) do
    case TranslationPlan.translate(plan, table, source_id) do
      nil -> :keep
      translated_id -> {:replace, translated_id}
    end
  end

  defp translate_override_value(source_id, current, %{type_path: type_path, table_map: table_map}, %TranslationPlan{} = plan) do
    case current |> fetch_nested(type_path) |> then(&Map.get(table_map, &1)) do
      nil ->
        :keep

      table ->
        case TranslationPlan.translate(plan, table, source_id) do
          nil -> :keep
          translated_id -> {:replace, translated_id}
        end
    end
  end

  defp maybe_put_translation(content, key, table, source_id, %TranslationPlan{} = plan) do
    case TranslationPlan.translate(plan, table, source_id) do
      nil -> content
      translated_id -> Map.put(content, key, translated_id)
    end
  end

  defp fetch_nested(value, []), do: value

  defp fetch_nested(value, [key | rest]) when is_map(value) do
    value
    |> Map.get(key)
    |> fetch_nested(rest)
  end

  defp fetch_nested(_value, _path), do: nil
end
