defmodule Operately.Repo do
  use Ecto.Repo, otp_app: :operately, adapter: Ecto.Adapters.Postgres

  import Ecto.Query

  def get_by_id(queryable, id) do
    query = from g in queryable, where: g.id == ^id
    __MODULE__.one(query)
  end

  def get_by_id(queryable, id, :with_deleted) do
    query = from g in queryable, where: g.id == ^id
    __MODULE__.one(query, with_deleted: true)
  end

  #
  # Soft Delete
  #
  # Soft delete is a way to mark records as deleted without actually deleting them.
  # This is useful for auditing purposes and to prevent accidental deletion of records.
  # This module provides a way to soft delete records by adding a deleted_at column
  # to the schema and overriding the query operations to exclude soft deleted records
  # by default.
  #
  # To load soft deleted records, pass the :with_deleted option as true to the query
  # operation.
  #
  # Example:
  #
  #   Repo.all((from p in Post, where: p.id == 1), with_deleted: true)
  #

  def soft_delete_all(queryable) do
    update_all(queryable, set: [deleted_at: DateTime.utc_now()])
  end

  def soft_delete(struct_or_changeset) do
    struct_or_changeset
    |> Ecto.Changeset.change(deleted_at: DateTime.utc_now())
    |> update()
  end

  def soft_delete!(struct_or_changeset) do
    struct_or_changeset
    |> Ecto.Changeset.change(deleted_at: DateTime.utc_now())
    |> update!()
  end

  @doc """
  Overrides all query operations to exclude soft deleted records
  if the schema in the from clause has a deleted_at column
  NOTE: will not exclude soft deleted records if :with_deleted option passed as true
  """
  def prepare_query(_operation, query, opts) do
    schema_module = get_schema_module_from_query(query)
    fields = if schema_module, do: schema_module.__schema__(:fields), else: []
    soft_deletable? = Enum.member?(fields, :deleted_at)

    if has_include_deleted_at_clause?(query) || opts[:with_deleted] || !soft_deletable? do
      {query, opts}
    else
      query = from(x in query, where: is_nil(x.deleted_at))
      {query, opts}
    end
  end

  #
  # Checks the query to see if it contains a where not is_nil(deleted_at)
  # if it does, we want to be sure that we don't exclude soft deleted records
  #
  defp has_include_deleted_at_clause?(%Ecto.Query{wheres: wheres}) do
    Enum.any?(wheres, fn %{expr: expr} ->
      expr == {:not, [], [{:is_nil, [], [{{:., [], [{:&, [], [0]}, :deleted_at]}, [], []}]}]}
    end)
  end

  defp get_schema_module_from_query(%Ecto.Query{from: %{source: {_name, module}}}) do
    module
  end

  defp get_schema_module_from_query(_), do: nil

  #
  # Extracts Result from a transaction that was running a multi.
  # Example:
  #
  # Ecto.Multi.new()
  # |> Ecto.Multi.insert(:project, ...)
  # |> Ecto.Multi.insert(:champion, ...)
  # |> Repo.transaction()
  # |> Repo.extract_result(:project)
  #
  # The returned value will be the result of the :project operation.
  #
  def extract_result(multi_result, field) do
    case multi_result do
      {:ok, %{^field => result}} -> {:ok, result}
      {:ok, _} -> {:error, :cannot_extract_result, field}
      {:error, reason} -> {:error, reason}
      error -> error
    end
  end
end
