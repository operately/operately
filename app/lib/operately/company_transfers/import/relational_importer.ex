defmodule Operately.CompanyTransfers.Import.RelationalImporter do
  @moduledoc """
  Imports the minimal relational slice of a company package into the current database.
  """

  alias Operately.CompanyTransfers.Export.Relational.SchemaSnapshot

  alias Operately.CompanyTransfers.Import.{
    AccountResolver,
    ActivityContentRewriter,
    Package,
    PackageOrder,
    PolymorphicReferenceTranslator,
    PolymorphicRowPruner,
    RichTextRewriter,
    RowDeserializer,
    TranslationPlan
  }

  alias Operately.CompanyTransfers.Import.Relational.Sql
  alias Operately.CompanyTransfers.Schema.AppSchemas

  @plain_reference_registry %{
    "subscription_lists" => [
      %{
        column: "parent_id",
        type_column: "parent_type",
        table_map: %{
          "comment_thread" => "comment_threads",
          "goal_update" => "goal_updates",
          "message" => "messages",
          "project" => "projects",
          "project_check_in" => "project_check_ins",
          "project_milestone" => "project_milestones",
          "project_retrospective" => "project_retrospectives",
          "project_task" => "tasks",
          "resource_hub_document" => "resource_documents",
          "resource_hub_file" => "resource_files",
          "resource_hub_link" => "resource_links"
        }
      }
    ]
  }

  def import(%Package{} = package) do
    schema = SchemaSnapshot.load()

    package =
      package
      |> PolymorphicRowPruner.prune()
      |> PackageOrder.reorder_for_insert(schema)

    with {:ok, account_resolution} <- AccountResolver.resolve(package),
         plan = TranslationPlan.build(package, account_resolution.mapping),
         {:ok, deferred_updates} <- insert_tables(package, schema, plan),
         :ok <- apply_deferred_updates(deferred_updates) do
      {:ok,
       %{
         company_id: TranslationPlan.imported_company_id(plan, package),
         account_resolution: account_resolution,
         rows_count: package.manifest["rows_count"] || 0,
         tables_count: package.manifest["tables_count"] || 0,
         files_count: package.manifest["files_count"] || 0
       }}
    end
  end

  defp insert_tables(%Package{} = package, %SchemaSnapshot{} = schema, %TranslationPlan{} = plan) do
    Enum.reduce_while(package.tables, {:ok, []}, fn table_entry, {:ok, deferred_updates} ->
      table = table_entry["name"]
      rows = Map.get(table_entry, "rows", [])

      cond do
        table == "accounts" or rows == [] ->
          {:cont, {:ok, deferred_updates}}

        true ->
          case insert_table(table_entry, schema, plan) do
            {:ok, table_deferred_updates} ->
              {:cont, {:ok, deferred_updates ++ table_deferred_updates}}

            {:error, _reason} = error ->
              {:halt, error}
          end
      end
    end)
  end

  defp insert_table(table_entry, %SchemaSnapshot{} = schema, %TranslationPlan{} = plan) do
    table = table_entry["name"]
    columns = Enum.map(table_entry["columns"], & &1["name"])
    nullable_columns = Map.new(table_entry["columns"], &{&1["name"], &1["nullable"]})
    foreign_keys = Map.get(schema.foreign_keys, table, [])
    map_fields = AppSchemas.map_fields_for_table(table)

    Enum.reduce_while(table_entry["rows"], {:ok, []}, fn row, {:ok, deferred_updates} ->
      case build_import_row(row, table, columns, nullable_columns, foreign_keys, map_fields, plan) do
        {:ok, import_row, row_deferred_updates} ->
          Sql.insert_row!(table, columns, import_row)
          {:cont, {:ok, deferred_updates ++ row_deferred_updates}}

        {:skip, _reason} ->
          {:cont, {:ok, deferred_updates}}

        {:error, _reason} = error ->
          {:halt, error}
      end
    end)
  end

  # Prepares one row for insert by rewriting serialized content, translating IDs,
  # and deferring later foreign keys.
  defp build_import_row(row, table, columns, nullable_columns, foreign_keys, map_fields, %TranslationPlan{} = plan) do
    with {:ok, row} <- prepare_row(row, table, map_fields, plan),
         {:ok, row} <- apply_translations(row, table, plan),
         {:ok, translated_row, deferred_updates} <- translate_foreign_keys(row, table, nullable_columns, foreign_keys, plan) do
      {:ok, Map.take(translated_row, columns), deferred_updates}
    end
  end

  defp prepare_row(row, table, map_fields, %TranslationPlan{} = plan) do
    with {:ok, row} <-
           row
           |> RowDeserializer.deserialize_row()
           |> ActivityContentRewriter.rewrite_row_content(table, plan),
         {:ok, row} <- RichTextRewriter.rewrite_row_mentions(row, table, plan, map_fields) do
      {:ok, row}
    end
  end

  defp apply_translations(row, table, plan) do
    row
    |> translate_primary_key(table, plan)
    |> handle_company_short_id(table)
    |> PolymorphicReferenceTranslator.translate_row(table, plan)
    |> case do
      {:ok, row} -> {:ok, translate_plain_references(row, table, plan)}
      other -> other
    end
  end

  defp translate_primary_key(row, table, %TranslationPlan{} = plan) do
    case row["id"] do
      id when is_binary(id) ->
        case TranslationPlan.translate(plan, table, id) do
          nil -> row
          translated_id -> Map.put(row, "id", translated_id)
        end

      _ ->
        row
    end
  end

  defp handle_company_short_id(row, "companies") do
    case row["short_id"] do
      short_id when is_integer(short_id) ->
        if short_id_taken?(short_id) do
          new_short_id = Operately.Companies.ShortId.generate()
          Map.put(row, "short_id", new_short_id)
        else
          row
        end

      _ ->
        row
    end
  end

  defp handle_company_short_id(row, _table), do: row

  defp short_id_taken?(short_id) do
    import Ecto.Query
    alias Operately.Companies.Company
    Operately.Repo.exists?(from c in Company, where: c.short_id == ^short_id)
  end

  # Translates typed references stored outside normal foreign keys.
  defp translate_plain_references(row, table, %TranslationPlan{} = plan) do
    Enum.reduce(Map.get(@plain_reference_registry, table, []), row, fn config, acc ->
      translate_plain_reference(acc, config, plan)
    end)
  end

  defp translate_plain_reference(row, %{column: column, type_column: type_column, table_map: table_map}, %TranslationPlan{} = plan) do
    case {row[column], row[type_column]} do
      {id, type} when is_binary(id) and is_binary(type) ->
        case Map.get(table_map, type) do
          nil ->
            row

          referenced_table ->
            case TranslationPlan.translate(plan, referenced_table, id) do
              nil -> row
              translated_id -> Map.put(row, column, translated_id)
            end
        end

      _ ->
        row
    end
  end

  defp translate_foreign_keys(row, table, nullable_columns, foreign_keys, %TranslationPlan{} = plan) do
    order_index = plan.table_index

    Enum.reduce_while(foreign_keys, {:ok, row, []}, fn fk, {:ok, acc_row, deferred_updates} ->
      case Map.get(acc_row, fk.column) do
        nil ->
          {:cont, {:ok, acc_row, deferred_updates}}

        source_id ->
          case TranslationPlan.translate(plan, fk.references_table, source_id) do
            nil ->
              handle_missing_reference_translation(table, fk, acc_row, deferred_updates, source_id)

            translated_id ->
              if defer_foreign_key?(table, fk, nullable_columns, order_index) do
                deferred_row = %{"id" => acc_row["id"], fk.column => translated_id}
                {:cont, {:ok, Map.put(acc_row, fk.column, nil), [deferred_update(table, deferred_row) | deferred_updates]}}
              else
                {:cont, {:ok, Map.put(acc_row, fk.column, translated_id), deferred_updates}}
              end
          end
      end
    end)
  end

  # Temporary until comment threads are included in company transfers. Activities
  # can point at threads that were intentionally not imported, so we clear the FK
  # instead of failing the whole import.
  defp handle_missing_reference_translation("activities", %{column: "comment_thread_id"}, acc_row, deferred_updates, _source_id) do
    {:cont, {:ok, Map.put(acc_row, "comment_thread_id", nil), deferred_updates}}
  end

  defp handle_missing_reference_translation(table, fk, _acc_row, _deferred_updates, source_id) do
    {:halt, {:error, {:missing_reference_translation, table, fk.column, fk.references_table, source_id}}}
  end

  defp defer_foreign_key?(table, fk, nullable_columns, order_index) do
    later_reference? = Map.get(order_index, fk.references_table, -1) > Map.get(order_index, table, -1)
    self_reference? = fk.references_table == table
    nullable? = Map.get(nullable_columns, fk.column, false)

    cond do
      (self_reference? or later_reference?) and nullable? -> true
      self_reference? or later_reference? -> raise ArgumentError, "Cannot defer non-nullable foreign key #{table}.#{fk.column}"
      true -> false
    end
  end

  defp deferred_update(table, row) do
    %{
      table: table,
      row: row,
      columns: Map.keys(row) -- ["id"]
    }
  end

  defp apply_deferred_updates(deferred_updates) do
    Enum.each(deferred_updates, fn update ->
      Sql.update_row!(update.table, update.columns, update.row)
    end)

    :ok
  end
end
