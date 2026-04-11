defmodule Operately.CompanyTransfers.ImporterTest do
  use Operately.DataCase
  import Ecto.Query, only: [from: 2]

  alias Operately.Companies.Company
  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.{Exporter, Importer}
  alias Operately.CompanyTransfers.Package.{PackageJson, Paths}
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Projects.Project
  alias Operately.Repo

  setup do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    {:ok, Factory.setup(%{})}
  end

  test "run/1 imports the minimal relational package with translated ids and reused accounts", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_company_member(:member)

    ctx =
      ctx
      |> Factory.add_subscription(:subscription, :project, person: ctx.member)

    short_id = unique_short_id()

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               package
               |> replace_company_short_id(short_id)
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_company = Repo.get!(Company, completed_run.company_id)
    imported_project = Repo.get_by!(Project, company_id: imported_company.id, name: ctx.project.name)
    imported_people = Repo.all(from p in Person, where: p.company_id == ^imported_company.id)
    imported_member = Enum.find(imported_people, &(&1.full_name == ctx.member.full_name))
    imported_creator = Enum.find(imported_people, &(&1.full_name == ctx.creator.full_name))
    imported_subscription_list = Repo.get_by!(SubscriptionList, parent_type: :project, parent_id: imported_project.id)
    imported_subscription = Repo.get_by!(Subscription, subscription_list_id: imported_subscription_list.id, person_id: imported_member.id)

    assert completed_run.status == :completed
    assert completed_run.started_at != nil
    assert completed_run.completed_at != nil
    assert completed_run.current_step == "completed"
    assert completed_run.percentage == 100.0
    assert completed_run.company_id != ctx.company.id

    assert imported_company.name == ctx.company.name
    assert imported_company.short_id == short_id
    assert imported_project.id != ctx.project.id
    assert imported_project.company_id == imported_company.id

    assert imported_creator.account_id == ctx.creator.account_id
    assert imported_member.account_id == ctx.member.account_id
    assert imported_member.company_id == imported_company.id

    assert imported_subscription.id != ctx.subscription.id
    assert imported_subscription.subscription_list_id == imported_subscription_list.id
    assert imported_subscription.person_id == imported_member.id
    assert imported_subscription_list.parent_id == imported_project.id

    assert completed_run.manifest_summary["source_company"]["id"] == ctx.company.id
    assert completed_run.manifest_summary["account_resolution"] == %{
             "reused_count" => 2,
             "created_count" => 0
           }
  end

  test "run/1 fails validation when the package short_id is already taken", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, import_run} = export_and_stage_import(ctx)
    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:error, {:validation_failed, message, errors}} = Importer.run(import_run)
    assert message =~ "short_id"
    assert Enum.any?(errors, &(&1["code"] == "company_short_id_taken"))
  end

  test "run/1 fails validation when schema migrations do not match", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               put_in(package, ["manifest", "schema_migrations"], [999_999_999])
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:error, {:validation_failed, _message, errors}} = Importer.run(import_run)
    assert Enum.any?(errors, &(&1["code"] == "schema_migration_mismatch"))
  end

  test "run/1 creates missing destination accounts when exported emails do not exist", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_company_member(:member)

    imported_email = "imported-#{System.unique_integer([:positive])}@example.com"
    imported_name = "Imported #{ctx.member.full_name}"
    short_id = unique_short_id()

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               package
               |> replace_company_short_id(short_id)
               |> replace_account_email(ctx.member.account_id, imported_email, imported_name)
               |> replace_person_email(ctx.member.id, imported_email, imported_name)
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_company = Repo.get!(Company, completed_run.company_id)
    imported_person = Repo.get_by!(Person, company_id: imported_company.id, email: imported_email)
    imported_account = Repo.get!(Account, imported_person.account_id)

    assert imported_account.email == imported_email
    assert imported_account.id != ctx.member.account_id
    assert completed_run.manifest_summary["account_resolution"] == %{
             "reused_count" => 1,
             "created_count" => 1
           }
  end

  defp export_and_stage_import(ctx, mutate_package \\ & &1) do
    assert {:ok, export_run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, export_run} = CompanyTransfers.mark_export_run_running(export_run)
    assert {:ok, export_run} = Exporter.run(export_run)

    package =
      export_run.json_path
      |> PackageJson.read!()
      |> mutate_package.()

    assert {:ok, import_run} = CompanyTransfers.create_import_run(ctx.account, %{}, dispatch: false)
    assert {:ok, import_run, workspace} = CompanyTransfers.prepare_import_workspace(import_run)
    _json_meta = PackageJson.write!(workspace.json_path, package)

    CompanyTransfers.update_import_run(import_run, %{
      json_path: workspace.json_path,
      zip_path: workspace.zip_path
    })
  end

  defp replace_company_short_id(package, short_id) do
    package
    |> update_in(["tables"], fn tables ->
      Enum.map(tables, fn table ->
        if table["name"] == "companies" do
          update_in(table, ["rows"], fn rows ->
            Enum.map(rows, &Map.put(&1, "short_id", short_id))
          end)
        else
          table
        end
      end)
    end)
    |> put_in(["manifest", "source_company", "short_id"], short_id)
  end

  defp replace_account_email(package, account_id, email, full_name) do
    update_in(package, ["tables"], fn tables ->
      Enum.map(tables, fn table ->
        if table["name"] == "accounts" do
          update_in(table, ["rows"], fn rows ->
            Enum.map(rows, fn row ->
              if row["id"] == account_id do
                row
                |> Map.put("email", email)
                |> Map.put("full_name", full_name)
              else
                row
              end
            end)
          end)
        else
          table
        end
      end)
    end)
  end

  defp replace_person_email(package, person_id, email, full_name) do
    update_in(package, ["tables"], fn tables ->
      Enum.map(tables, fn table ->
        if table["name"] == "people" do
          update_in(table, ["rows"], fn rows ->
            Enum.map(rows, fn row ->
              if row["id"] == person_id do
                row
                |> Map.put("email", email)
                |> Map.put("full_name", full_name)
              else
                row
              end
            end)
          end)
        else
          table
        end
      end)
    end)
  end

  defp unique_short_id do
    1_000_000 + System.unique_integer([:positive])
  end
end
