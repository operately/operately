defmodule Operately.CompanyTransfers.Import.Package do
  @moduledoc """
  In-memory representation of an exported company package JSON payload.
  """

  defstruct [:manifest, :tables, :table_map, :files]

  alias Operately.CompanyTransfers.Package.PackageJson

  def load!(path) when is_binary(path) do
    payload = PackageJson.read!(path)
    tables = Map.get(payload, "tables", [])

    %__MODULE__{
      manifest: Map.get(payload, "manifest", %{}),
      tables: tables,
      table_map: Map.new(tables, &{&1["name"], &1}),
      files: Map.get(payload, "files", [])
    }
  end

  def table(%__MODULE__{table_map: table_map}, table_name) when is_binary(table_name) do
    Map.get(table_map, table_name)
  end

  def table_rows(%__MODULE__{} = package, table_name) when is_binary(table_name) do
    package
    |> table(table_name)
    |> case do
      nil -> []
      table -> Map.get(table, "rows", [])
    end
  end

  def company_rows(%__MODULE__{} = package), do: table_rows(package, "companies")
  def account_rows(%__MODULE__{} = package), do: table_rows(package, "accounts")
end
