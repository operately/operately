defmodule Operately.Support.CompanyTransfer.Helpers do
  alias Operately.Companies.Company
  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.{Exporter, Importer}
  alias Operately.CompanyTransfers.Package.PackageJson
  alias Operately.People.Account
  alias Operately.Repo

  def export!(%Company{} = company, %Account{} = account) do
    {:ok, export_run} = CompanyTransfers.create_export_run(company, account, %{}, dispatch: false)
    {:ok, export_run} = CompanyTransfers.mark_export_run_running(export_run)
    {:ok, export_run} = Exporter.run(export_run)

    %{
      run: export_run,
      package: PackageJson.read!(export_run.json_path)
    }
  end

  def run_import(package, %Account{} = account) when is_map(package) do
    {:ok, import_run} = CompanyTransfers.create_import_run(account, %{}, dispatch: false)
    {:ok, import_run, workspace} = CompanyTransfers.prepare_import_workspace(import_run)
    _json_meta = PackageJson.write!(workspace.json_path, package)

    {:ok, import_run} =
      CompanyTransfers.update_import_run(import_run, %{
        json_path: workspace.json_path,
        zip_path: workspace.zip_path
      })

    {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    case Importer.run(import_run) do
      {:ok, import_run} ->
        {:ok, %{run: import_run, package: package}}

      {:error, reason} ->
        {:error, %{run: import_run, reason: reason, package: package}}
    end
  end

  def run_import!(package, %Account{} = account) when is_map(package) do
    case run_import(package, account) do
      {:ok, result} -> result
      {:error, %{reason: reason}} -> raise "Expected import to succeed, got: #{inspect(reason)}"
    end
  end

  def round_trip!(%Company{} = company, %Account{} = account, opts \\ []) do
    source = export!(company, account)
    mutate_package = Keyword.get(opts, :mutate_package, & &1)
    import_account = Keyword.get(opts, :import_account, account)
    reexport_account = Keyword.get(opts, :reexport_account, account)

    imported =
      source.package
      |> mutate_package.()
      |> run_import!(import_account)

    imported_company = Repo.get!(Company, imported.run.company_id)
    reexported = export!(imported_company, reexport_account)

    %{
      source: source,
      imported: imported,
      imported_company: imported_company,
      reexported: reexported
    }
  end

  def replace_company_short_id(package, short_id) when is_map(package) do
    package
    |> update_table_rows("companies", fn row -> Map.put(row, "short_id", short_id) end)
    |> put_in(["manifest", "source_company", "short_id"], short_id)
  end

  def replace_account_email(package, account_id, email, full_name) when is_map(package) do
    update_table_rows(package, "accounts", fn row ->
      if row["id"] == account_id do
        row
        |> Map.put("email", email)
        |> Map.put("full_name", full_name)
      else
        row
      end
    end)
  end

  def replace_person_email(package, person_id, email, full_name) when is_map(package) do
    update_table_rows(package, "people", fn row ->
      if row["id"] == person_id do
        row
        |> Map.put("email", email)
        |> Map.put("full_name", full_name)
      else
        row
      end
    end)
  end

  def update_row(package, table_name, row_id, fun) when is_map(package) and is_binary(table_name) and is_binary(row_id) and is_function(fun, 1) do
    update_table_rows(package, table_name, fn row ->
      if row["id"] == row_id do
        fun.(row)
      else
        row
      end
    end)
  end

  def update_table_rows(package, table_name, fun) when is_map(package) and is_binary(table_name) and is_function(fun, 1) do
    update_in(package, ["tables"], fn tables ->
      Enum.map(tables, fn table ->
        if table["name"] == table_name do
          update_in(table, ["rows"], fn rows -> Enum.map(rows, fun) end)
        else
          table
        end
      end)
    end)
  end
end
