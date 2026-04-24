defmodule Operately.CompanyTransfers.Import.Relational.RowWriter do
  @moduledoc """
  Persists imported relational rows through current Ecto schemas.
  """

  alias Ecto.Changeset
  alias Operately.CompanyTransfers.Schema.AppSchemas
  alias Operately.CompanyTransfers.Schema.PolicyRegistry
  alias Operately.Repo

  def insert_row(table, columns, row) when is_binary(table) and is_list(columns) and is_map(row) do
    with {:ok, schema, fields} <- schema_metadata(table),
         :ok <- validate_columns(table, columns, fields),
         :ok <- validate_row_keys(table, row, columns),
         {:ok, attrs} <- cast_attrs(schema, fields, columns, row) do
      schema
      |> struct()
      |> changeset_for_attrs(attrs)
      |> Repo.insert()
      |> case do
        {:ok, _record} -> :ok
        {:error, changeset} -> {:error, {:insert_failed, table, errors(changeset)}}
      end
    end
  end

  def update_row(table, columns, row) when is_binary(table) and is_list(columns) and is_map(row) do
    with {:ok, schema, fields} <- schema_metadata(table),
         :ok <- validate_update_row(table, row),
         :ok <- validate_columns(table, columns, fields),
         :ok <- validate_row_keys(table, row, ["id" | columns]),
         {:ok, attrs} <- cast_attrs(schema, fields, columns, row),
         {:ok, record} <- fetch_update_record(schema, table, row["id"]) do
      record
      |> changeset_for_attrs(attrs)
      |> Repo.update()
      |> case do
        {:ok, _record} -> :ok
        {:error, changeset} -> {:error, {:update_failed, table, row["id"], errors(changeset)}}
      end
    end
  end

  defp schema_metadata(table) do
    cond do
      not PolicyRegistry.importable?(table) ->
        {:error, {:table_not_importable, table}}

      true ->
        case AppSchemas.schema_for_table(table) do
          nil -> {:error, {:unknown_table, table}}
          schema -> {:ok, schema, AppSchemas.persisted_fields_for_table(table)}
        end
    end
  end

  defp validate_columns(table, columns, fields) do
    cond do
      columns == [] ->
        {:error, {:empty_columns, table}}

      Enum.any?(columns, &(not is_binary(&1))) ->
        {:error, {:invalid_columns, table, columns}}

      true ->
        case Enum.reject(columns, &Map.has_key?(fields, &1)) do
          [] -> :ok
          unknown_columns -> {:error, {:unknown_columns, table, unknown_columns}}
        end
    end
  end

  defp validate_row_keys(table, row, allowed_columns) do
    allowed = MapSet.new(allowed_columns)

    case row |> Map.keys() |> Enum.reject(&MapSet.member?(allowed, &1)) do
      [] -> :ok
      extra_keys -> {:error, {:unknown_row_keys, table, extra_keys}}
    end
  end

  defp validate_update_row(_table, %{"id" => id}) when is_binary(id), do: :ok
  defp validate_update_row(table, _row), do: {:error, {:invalid_update_row, table}}

  defp fetch_update_record(schema, table, id) do
    case Repo.get(schema, id) do
      nil -> {:error, {:missing_update_row, table, id}}
      record -> {:ok, record}
    end
  end

  defp cast_attrs(schema, fields, columns, row) do
    Enum.reduce_while(columns, {:ok, %{}}, fn column, {:ok, attrs} ->
      # Imported rows use DB column names; Ecto changesets expect schema field atoms.
      field = Map.fetch!(fields, column)
      type = schema.__schema__(:type, field)

      case cast_value(type, Map.get(row, column)) do
        {:ok, value} ->
          {:cont, {:ok, Map.put(attrs, field, value)}}

        {:error, reason} ->
          {:halt, {:error, {:invalid_value, schema.__schema__(:source), column, reason}}}
      end
    end)
  end

  defp cast_value(_type, nil), do: {:ok, nil}

  # Embedded schemas need a separate path because Ecto.Type.cast/2 does not cast
  # embed payloads the same way it casts regular scalar/container fields.
  defp cast_value({:parameterized, {Ecto.Embedded, embedded}}, value) do
    load_embed(embedded, value)
  rescue
    error -> {:error, Exception.message(error)}
  end

  defp cast_value({:embed, embedded}, value) do
    load_embed(embedded, value)
  rescue
    error -> {:error, Exception.message(error)}
  end

  # Regular fields are delegated to Ecto so enums, arrays, dates, decimals, etc.
  # follow the schema's declared type.
  defp cast_value(type, value) do
    case Ecto.Type.cast(type, value) do
      {:ok, value} -> {:ok, value}
      :error -> {:error, :cast_failed}
    end
  rescue
    error -> {:error, Exception.message(error)}
  end

  defp changeset_for_attrs(record, attrs) do
    embed_fields = record.__struct__.__schema__(:embeds)
    {embed_attrs, field_attrs} = Map.split(attrs, embed_fields)

    Enum.reduce(embed_attrs, Changeset.change(record, field_attrs), fn {field, value}, changeset ->
      Changeset.put_embed(changeset, field, value)
    end)
  end

  defp load_embed(%Ecto.Embedded{cardinality: :one, related: related}, value) when is_map(value) do
    loaded = Ecto.embedded_load(related, value, :json)
    {:ok, embedded_to_map(related, loaded)}
  end

  defp load_embed(%Ecto.Embedded{cardinality: :many, related: related}, values) when is_list(values) do
    {:ok, Enum.map(values, fn value -> embedded_to_map(related, Ecto.embedded_load(related, value, :json)) end)}
  end

  defp load_embed(%Ecto.Embedded{}, value) do
    {:error, {:invalid_embed, value}}
  end

  defp embedded_to_map(module, struct) do
    (module.__schema__(:fields) ++ module.__schema__(:embeds))
    |> Map.new(fn field ->
      {field, embedded_field_value(module, field, Map.get(struct, field))}
    end)
  end

  defp embedded_field_value(module, field, value) do
    if field in module.__schema__(:embeds) do
      embedded = module.__schema__(:embed, field)
      embedded_value_to_map(embedded, value)
    else
      value
    end
  end

  defp embedded_value_to_map(%Ecto.Embedded{cardinality: :one}, nil), do: nil
  defp embedded_value_to_map(%Ecto.Embedded{cardinality: :one, related: related}, value), do: embedded_to_map(related, value)
  defp embedded_value_to_map(%Ecto.Embedded{cardinality: :many, related: related}, values), do: Enum.map(values || [], &embedded_to_map(related, &1))

  defp errors(%Changeset{} = changeset) do
    Changeset.traverse_errors(changeset, fn {message, opts} ->
      Enum.reduce(opts, message, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
