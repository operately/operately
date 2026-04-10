defmodule Operately.CompanyTransfers.Export.RelationalCollector do
  alias Operately.CompanyTransfers.Export.Relational.{CompanyOwnedRows, DependencyParents, PackageTables, SchemaSnapshot}

  def collect(company_id) when is_binary(company_id) do
    schema = SchemaSnapshot.load()

    with {:ok, included_rows} <- CompanyOwnedRows.collect(schema, company_id) do
      dependency_rows = DependencyParents.collect(schema, included_rows)
      {:ok, PackageTables.build(schema, included_rows, dependency_rows)}
    end
  end
end
