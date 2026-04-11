defmodule Operately.CompanyTransfers.Import.TranslationPlan do
  @moduledoc """
  Source-to-destination ID mapping for imported relational rows.
  """

  defstruct [:id_map, :table_index]

  alias Operately.CompanyTransfers.Import.Package

  def build(%Package{} = package, account_id_map) when is_map(account_id_map) do
    id_map =
      Enum.reduce(package.tables, %{"accounts" => account_id_map}, fn table, acc ->
        case {table["name"], table["rows"]} do
          {"accounts", _rows} ->
            acc

          {table_name, rows} ->
            table_map =
              rows
              |> Enum.reduce(%{}, fn row, row_acc ->
                case row["id"] do
                  id when is_binary(id) -> Map.put(row_acc, id, Ecto.UUID.generate())
                  _ -> row_acc
                end
              end)

            Map.put(acc, table_name, table_map)
        end
      end)

    %__MODULE__{
      id_map: id_map,
      table_index: package.tables |> Enum.map(& &1["name"]) |> Enum.with_index() |> Map.new()
    }
  end

  def translate(%__MODULE__{}, _table, nil), do: nil

  def translate(%__MODULE__{id_map: id_map}, table, source_id) when is_binary(table) and is_binary(source_id) do
    get_in(id_map, [table, source_id])
  end

  def imported_company_id(%__MODULE__{} = plan, %Package{} = package) do
    case Package.company_rows(package) do
      [%{"id" => source_company_id}] -> translate(plan, "companies", source_company_id)
      _ -> nil
    end
  end
end
