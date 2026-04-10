defmodule Operately.CompanyTransfers.Export.Relational.DependencyParents do
  @moduledoc """
  Collects dependency-parent rows referenced by the already-owned company graph.

  Example:
  - a company-owned task references `subscription_lists.id = s1`
  - the collector fetches that `subscription_lists` row
  - that new row can enqueue more dependency parents or child dependency rows such as `subscriptions`
  - expansion stops once no unseen dependency lookups remain

  ## Queue Mechanics

  The same lookup key `{table, column}` can be enqueued multiple times as the graph expands.
  The `seen_lookups` map tracks which specific values have already been fetched for each key,
  preventing redundant database queries while allowing new values to be processed.
  """

  alias Operately.CompanyTransfers.Export.Relational.{LookupQueue, SchemaSnapshot, Sql}
  alias Operately.CompanyTransfers.Export.Relational.LookupQueue.DependencyLookup

  @type rows_by_table :: %{optional(String.t()) => [map()]}
  @type seen_lookups :: %{optional({String.t(), String.t()}) => MapSet.t(term())}
  @type storage_result :: {rows_by_table(), boolean()}
  @type expansion_result :: {rows_by_table(), LookupQueue.t()}

  defmodule State do
    defstruct [:schema, :queue, dependency_rows: %{}, seen_lookups: %{}]

    @type t :: %__MODULE__{
            schema: SchemaSnapshot.t(),
            queue: LookupQueue.t(),
            dependency_rows: map(),
            seen_lookups: map()
          }
  end

  def collect(%SchemaSnapshot{} = schema, owned_rows) when is_map(owned_rows) do
    owned_rows
    |> seed_queue_from_owned_rows(schema)
    |> build_initial_state(schema)
    |> expand_loop()
  end

  defp seed_queue_from_owned_rows(rows_by_table, %SchemaSnapshot{} = schema) do
    Enum.reduce(rows_by_table, LookupQueue.new(), fn {table, rows}, queue ->
      Enum.reduce(rows, queue, fn row, row_queue ->
        enqueue_dependency_parent_references(row_queue, schema, table, row)
      end)
    end)
  end

  defp build_initial_state(%LookupQueue{} = queue, %SchemaSnapshot{} = schema) do
    %State{schema: schema, queue: queue}
  end

  defp expand_loop(%State{} = state) do
    case LookupQueue.next(state.queue) do
      :empty ->
        state.dependency_rows

      {%DependencyLookup{} = lookup, rest_queue} ->
        state
        |> Map.put(:queue, rest_queue)
        |> process_lookup(lookup)
        |> expand_loop()
    end
  end

  defp process_lookup(%State{} = state, %DependencyLookup{} = lookup) do
    unseen_values = filter_unseen_values(lookup, state.seen_lookups)

    if unseen_values == [] do
      state
    else
      lookup = %{lookup | values: unseen_values}

      state
      |> fetch_and_integrate_rows(lookup)
      |> update_seen_lookups(lookup)
    end
  end

  defp filter_unseen_values(%DependencyLookup{table: table, column: column, values: values}, seen_lookups) do
    seen_values = Map.get(seen_lookups, {table, column}, MapSet.new())
    Enum.reject(values, &MapSet.member?(seen_values, &1))
  end

  defp fetch_and_integrate_rows(%State{} = state, %DependencyLookup{} = lookup) do
    rows = fetch_rows_for_lookup(state.schema, lookup)
    integrate_fetched_rows(state, lookup, rows)
  end

  defp fetch_rows_for_lookup(%SchemaSnapshot{columns: columns}, %DependencyLookup{table: table, column: column, values: values}) do
    Sql.fetch_rows_by_column!(table, column, values, Map.fetch!(columns, table))
  end

  defp integrate_fetched_rows(%State{} = state, %DependencyLookup{} = lookup, rows) do
    Enum.reduce(rows, state, fn row, state_acc ->
      integrate_new_row(state_acc, lookup.table, row)
    end)
  end

  defp integrate_new_row(%State{} = state, table, row) do
    case maybe_store_row(state.dependency_rows, table, row) do
      {dependency_rows, false} ->
        %{state | dependency_rows: dependency_rows}

      {dependency_rows, true} ->
        queue =
          state.queue
          |> enqueue_dependency_parent_references(state.schema, table, row)
          |> enqueue_dependent_children(state.schema, table, row)

        %{state | dependency_rows: dependency_rows, queue: queue}
    end
  end

  defp update_seen_lookups(%State{} = state, %DependencyLookup{table: table, column: column, values: values}) do
    key = {table, column}
    new_values = MapSet.new(values)
    seen_lookups = Map.update(state.seen_lookups, key, new_values, &MapSet.union(&1, new_values))
    %{state | seen_lookups: seen_lookups}
  end

  defp enqueue_dependency_parent_references(
         queue,
         %SchemaSnapshot{foreign_keys: foreign_keys, classifications: classifications},
         table,
         row
       ) do
    Enum.reduce(foreign_keys[table] || [], queue, fn fk, acc ->
      if classifications[fk.references_table] == :dependency_parent do
        LookupQueue.enqueue(acc, fk.references_table, fk.references_column, Map.get(row, fk.column))
      else
        acc
      end
    end)
  end

  defp enqueue_dependent_children(
         queue,
         %SchemaSnapshot{reverse_foreign_keys: reverse_foreign_keys, classifications: classifications},
         table,
         row
       ) do
    Enum.reduce(reverse_foreign_keys[table] || [], queue, fn fk, acc ->
      if classifications[fk.table] == :dependency_parent do
        LookupQueue.enqueue(acc, fk.table, fk.column, Map.get(row, fk.references_column))
      else
        acc
      end
    end)
  end

  defp maybe_store_row(dependency_rows, table, row) do
    rows_for_table = Map.get(dependency_rows, table, [])

    if Enum.any?(rows_for_table, &(&1["id"] == row["id"])) do
      {dependency_rows, false}
    else
      {Map.put(dependency_rows, table, rows_for_table ++ [row]), true}
    end
  end
end
