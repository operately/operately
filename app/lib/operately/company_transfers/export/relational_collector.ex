defmodule Operately.CompanyTransfers.Export.RelationalCollector do
  alias Operately.CompanyTransfers.Export.ActivitiesCollector
  alias Operately.CompanyTransfers.Export.PolymorphicCollector
  alias Operately.CompanyTransfers.Export.Relational.{CompanyOwnedRows, DependencyParents, PackageTables, SchemaSnapshot}

  def collect(company_id) when is_binary(company_id) do
    schema = SchemaSnapshot.load()

    with {:ok, included_rows} <- CompanyOwnedRows.collect(schema, company_id) do
      custom_rows = ActivitiesCollector.collect(schema, company_id)
      polymorphic_rows = PolymorphicCollector.collect(schema, Map.merge(included_rows, custom_rows))

      non_dependency_rows =
        included_rows
        |> Map.merge(custom_rows)
        |> Map.merge(polymorphic_rows)

      dependency_rows = DependencyParents.collect(schema, non_dependency_rows)
      custom_rows = custom_rows |> Map.merge(polymorphic_rows)

      {:ok, PackageTables.build(schema, included_rows, dependency_rows, custom_rows)}
    end
  end
end
