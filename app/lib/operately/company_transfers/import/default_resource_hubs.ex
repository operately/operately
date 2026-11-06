defmodule Operately.CompanyTransfers.Import.DefaultResourceHubs do
  @moduledoc "Initializes missing default hub references in older company packages."

  alias Operately.CompanyTransfers.Import.Package

  def normalize(%Package{} = package) do
    hubs =
      case Package.table(package, "resource_hubs") do
        nil -> []
        table -> table["rows"] || []
      end

    positions =
      hubs
      |> Enum.group_by(& &1["space_id"])
      |> Enum.flat_map(fn {space_id, rows} ->
        rows |> Enum.sort_by(&{&1["inserted_at"], &1["id"]}) |> Enum.with_index() |> Enum.map(fn {hub, index} -> {hub["id"], if(space_id, do: index, else: 0)} end)
      end)
      |> Map.new()

    defaults =
      hubs
      |> Enum.filter(& &1["space_id"])
      |> Enum.sort_by(&{&1["inserted_at"], &1["id"]})
      |> Enum.reduce(%{}, fn hub, acc -> Map.put_new(acc, hub["space_id"], hub["id"]) end)

    tables =
      Enum.map(package.tables, fn
        %{"name" => "resource_hubs"} = table ->
          Map.update!(table, "rows", fn rows ->
            Enum.map(rows, fn row -> Map.put(row, "position", row["position"] || positions[row["id"]]) end)
          end)

        %{"name" => "groups"} = table ->
          Map.update!(table, "rows", fn rows ->
            Enum.map(rows, fn row ->
              if row["default_resource_hub_id"],
                do: row,
                else: Map.put(row, "default_resource_hub_id", defaults[row["id"]])
            end)
          end)

        table ->
          table
      end)

    %{package | tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}
  end
end
