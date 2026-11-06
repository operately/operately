defmodule Operately.CompanyTransfers.Import.DefaultResourceHubs do
  @moduledoc "Preserves hub ordering across ID remapping and initializes missing positions and defaults in older packages."

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
      |> Enum.flat_map(&ordered_positions/1)
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
            Enum.map(rows, fn row -> Map.put(row, "position", positions[row["id"]]) end)
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

  defp ordered_positions({nil, hubs}) do
    Enum.map(hubs, &{&1["id"], &1["position"] || 0})
  end

  defp ordered_positions({_space_id, hubs}) do
    hubs
    |> Enum.sort_by(&{&1["inserted_at"], &1["id"]})
    |> Enum.with_index()
    |> Enum.map(fn {hub, index} -> Map.put(hub, "position", hub["position"] || index) end)
    |> Enum.sort_by(&{&1["position"], &1["inserted_at"], &1["id"]})
    |> Enum.map_reduce(nil, fn hub, previous ->
      # Make positions strictly increasing before IDs are remapped, preserving gaps where possible.
      position = if is_nil(previous), do: hub["position"], else: max(hub["position"], previous + 1)
      {{hub["id"], position}, position}
    end)
    |> elem(0)
  end
end
