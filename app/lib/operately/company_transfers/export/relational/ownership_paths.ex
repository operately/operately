defmodule Operately.CompanyTransfers.Export.Relational.OwnershipPaths do
  @moduledoc """
  Resolves FK paths from included tables back to the owning `companies` row.
  """

  alias Operately.CompanyTransfers.Export.Relational.SchemaSnapshot

  @company_table "companies"

  def find_paths_to_company(@company_table, %SchemaSnapshot{}), do: [[]]

  def find_paths_to_company(table, %SchemaSnapshot{} = schema) when is_binary(table) do
    table
    |> walk_paths(schema, MapSet.new([table]))
    |> Enum.uniq()
  end

  defp walk_paths(table, %SchemaSnapshot{foreign_keys: foreign_keys, classifications: classifications} = schema, visited) do
    foreign_keys[table]
    |> Enum.filter(&(classifications[&1.references_table] == :included))
    |> Enum.flat_map(fn fk ->
      parent = fk.references_table
      edge = %{from_table: table, to_table: parent, column: fk.column, references_column: fk.references_column}

      cond do
        parent == @company_table ->
          [[edge]]

        MapSet.member?(visited, parent) ->
          []

        true ->
          parent
          |> walk_paths(schema, MapSet.put(visited, parent))
          |> Enum.map(&[edge | &1])
      end
    end)
  end
end
