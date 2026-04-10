defmodule Operately.CompanyTransfers.Export.Relational.SchemaSnapshot do
  @moduledoc """
  Immutable snapshot of the database schema metadata used by relational export.
  """

  alias Operately.CompanyTransfers.Schema.{Discovery, Graph}

  defstruct [:tables, :columns, :foreign_keys, :reverse_foreign_keys, :classifications]

  @type t :: %__MODULE__{
          tables: [String.t()],
          columns: %{optional(String.t()) => [String.t()]},
          foreign_keys: map(),
          reverse_foreign_keys: map(),
          classifications: %{optional(String.t()) => atom()}
        }

  def load do
    tables = Graph.get_tables()

    %__MODULE__{
      tables: tables,
      columns: Map.new(tables, &{&1, Graph.get_columns(&1)}),
      foreign_keys: Map.new(tables, &{&1, Graph.get_foreign_keys(&1)}),
      reverse_foreign_keys: build_reverse_foreign_keys(tables),
      classifications: Map.new(tables, &{&1, Discovery.classify_table(&1)})
    }
  end

  def included_tables(%__MODULE__{classifications: classifications}) do
    classifications
    |> Enum.filter(fn {_table, classification} -> classification == :included end)
    |> Enum.map(&elem(&1, 0))
  end

  defp build_reverse_foreign_keys(tables) do
    Enum.reduce(tables, %{}, fn table, acc ->
      Enum.reduce(Graph.get_foreign_keys(table), acc, fn fk, fk_acc ->
        reverse_fk = %{
          table: table,
          column: fk.column,
          references_column: fk.references_column
        }

        Map.update(fk_acc, fk.references_table, [reverse_fk], &[reverse_fk | &1])
      end)
    end)
  end
end
