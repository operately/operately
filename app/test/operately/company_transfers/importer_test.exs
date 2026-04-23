defmodule Operately.CompanyTransfers.ImporterTest do
  use Operately.DataCase
  import Ecto.Query, only: [from: 2]

  alias Operately.Activities
  alias Operately.Activities.Activity
  alias Operately.Blobs
  alias Operately.Blobs.Blob
  alias Operately.Companies.Company
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.{Exporter, Importer}
  alias Operately.InviteLinks
  alias Operately.CompanyTransfers.Package.{PackageJson, Paths}
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Projects.Project
  alias Operately.ResourceHubs.Document
  alias Operately.Repo
  alias Operately.Support.CompanyTransfer.Helpers, as: Transfers
  alias OperatelyWeb.Paths, as: WebPaths

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

  test "run/1 generates new short_id when the package short_id is already taken", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    original_short_id = ctx.company.short_id

    assert {:ok, import_run} = export_and_stage_import(ctx)
    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:ok, completed_run} = Importer.run(import_run)

    imported_company = Repo.get!(Company, completed_run.company_id)

    # Import should succeed
    assert completed_run.status == :completed

    # Imported company should have a different short_id than the original
    assert imported_company.short_id != original_short_id

    # Original company should still exist with its short_id
    original_company = Repo.get!(Company, ctx.company.id)
    assert original_company.short_id == original_short_id
  end

  test "run/1 keeps original short_id when it is not taken", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    unique_id = unique_short_id()

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               replace_company_short_id(package, unique_id)
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_company = Repo.get!(Company, completed_run.company_id)

    # Import should succeed
    assert completed_run.status == :completed

    # Imported company should keep the original short_id since it wasn't taken
    assert imported_company.short_id == unique_id
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

  test "run/1 emails imported people, excludes the importer, and creates invite links for newly created accounts", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:member)
      |> Factory.add_outside_collaborator(:guest, :creator)

    imported_guest_email = "imported-guest-#{System.unique_integer([:positive])}@example.com"
    imported_guest_name = "Imported #{ctx.guest.full_name}"

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               package
               |> replace_account_email(ctx.guest.account_id, imported_guest_email, imported_guest_name)
               |> replace_person_email(ctx.guest.id, imported_guest_email, imported_guest_name)
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_company = Repo.get!(Company, completed_run.company_id)
    imported_member = Repo.get_by!(Person, company_id: imported_company.id, email: ctx.member.email)
    imported_guest = Repo.get_by!(Person, company_id: imported_company.id, email: imported_guest_email)

    login_url = WebPaths.login_path() |> WebPaths.to_url()
    {:ok, invite_link} = InviteLinks.get_personal_invite_link_for_person(imported_guest.id)
    invite_url = WebPaths.join_path(invite_link.token) |> WebPaths.to_url()

    # Reused accounts should be notified without getting a fresh personal invite link.
    assert {:error, :not_found} = InviteLinks.get_personal_invite_link_for_person(imported_member.id)

    member_email = imported_member.email
    guest_email = imported_guest.email
    creator_email = ctx.creator.email

    # Existing destination accounts get the standard "added to company" email path.
    assert_received {:email, %{to: [{_, ^member_email}], text_body: member_text_body}}
    assert member_text_body =~ "added you as a company member"
    assert member_text_body =~ login_url
    refute String.contains?(member_text_body, "/join?token=")

    # Newly created destination accounts get the first-login invite path.
    assert_received {:email, %{to: [{_, ^guest_email}], text_body: guest_text_body}}
    assert guest_text_body =~ "outside collaborator"
    assert guest_text_body =~ invite_url

    # The importer already knows about the transfer and should not be emailed.
    refute_received {:email, %{to: [{_, ^creator_email}]}}
  end

  test "run/1 imports activities, preserves missing content ids, and clears untranslated comment_thread_id", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:member)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    create_transfer_activity!(ctx.creator, :project_champion_updating, %{
      company_id: ctx.company.id,
      space_id: ctx.space.id,
      project_id: ctx.project.id,
      old_champion_id: ctx.creator.id,
      new_champion_id: ctx.member.id
    })

    missing_champion_id = Ecto.UUID.generate()
    missing_comment_thread_id = Ecto.UUID.generate()

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               activity = activity_row!(package, "project_champion_updating")

               Transfers.update_row(package, "activities", activity["id"], fn row ->
                 row
                 |> Map.put("comment_thread_id", missing_comment_thread_id)
                 |> put_in(["content", "new_champion_id"], missing_champion_id)
               end)
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_project = Repo.get_by!(Project, company_id: completed_run.company_id, name: ctx.project.name)

    imported_activity =
      Repo.one!(
        from a in Activity,
          where: a.action == "project_champion_updating",
          where: fragment("? ->> 'company_id' = ?", a.content, ^completed_run.company_id)
      )

    assert imported_activity.comment_thread_id == nil
    assert imported_activity.content["project_id"] == imported_project.id
    assert imported_activity.content["new_champion_id"] == missing_champion_id
  end

  test "run/1 fails when an activity author_id cannot be translated", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:member)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    create_transfer_activity!(ctx.creator, :project_champion_updating, %{
      company_id: ctx.company.id,
      space_id: ctx.space.id,
      project_id: ctx.project.id,
      old_champion_id: ctx.creator.id,
      new_champion_id: ctx.member.id
    })

    missing_author_id = Ecto.UUID.generate()

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               activity = activity_row!(package, "project_champion_updating")

               Transfers.update_row(package, "activities", activity["id"], &Map.put(&1, "author_id", missing_author_id))
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:error, {:missing_reference_translation, "activities", "author_id", "people", ^missing_author_id}} = Importer.run(import_run)
  end

  test "run/1 fails when an activity access_context_id cannot be translated", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:member)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    create_transfer_activity!(ctx.creator, :project_champion_updating, %{
      company_id: ctx.company.id,
      space_id: ctx.space.id,
      project_id: ctx.project.id,
      old_champion_id: ctx.creator.id,
      new_champion_id: ctx.member.id
    })

    missing_access_context_id = Ecto.UUID.generate()

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               activity = activity_row!(package, "project_champion_updating")

               Transfers.update_row(package, "activities", activity["id"], &Map.put(&1, "access_context_id", missing_access_context_id))
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:error, {:missing_reference_translation, "activities", "access_context_id", "access_contexts", ^missing_access_context_id}} = Importer.run(import_run)
  end

  test "run/1 uploads blob payloads and rewrites blob references in rich text", ctx do
    ctx =
      ctx
      |> Factory.add_blob(:embedded_blob)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)

    ctx =
      ctx
      |> Factory.add_document(:document, :hub, content: blob_document(ctx.embedded_blob))

    on_exit(fn ->
      cleanup_blob_storage([ctx.embedded_blob])
    end)

    upload_blob_payload!(ctx.embedded_blob, "embedded payload")

    assert {:ok, export_run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, export_run} = CompanyTransfers.mark_export_run_running(export_run)
    assert {:ok, export_run} = Exporter.run(export_run)

    assert {:ok, import_run} =
             CompanyTransfers.create_import_run(
               ctx.account,
               %{
                 json_blob_id: export_run.json_blob_id,
                 zip_blob_id: export_run.zip_blob_id
               },
               dispatch: false
             )

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_document =
      Repo.one!(
        from d in Document,
          join: n in assoc(d, :node),
          join: h in assoc(n, :resource_hub),
          join: s in assoc(h, :space),
          where: s.company_id == ^completed_run.company_id,
          where: n.name == "Document"
      )

    [imported_blob_id] = Operately.RichContent.Blob.find_ids(imported_document.content)
    imported_blob = Blobs.get_blob!(imported_blob_id)

    assert imported_blob.id != ctx.embedded_blob.id
    assert imported_blob.storage_type == String.to_existing_atom(Application.get_env(:operately, :storage_type))
    assert File.read!(storage_path(imported_blob)) == "embedded payload"

    [blob_node] = imported_document.content["content"]
    assert blob_node["attrs"]["id"] == WebPaths.blob_id(imported_blob)
    assert blob_node["attrs"]["src"] == Blob.url(imported_blob)

    _ = File.rm(storage_path(imported_blob))
  end

  defp export_and_stage_import(ctx, mutate_package \\ & &1) do
    package = export_package(ctx, mutate_package)
    stage_import(ctx.account, package)
  end

  defp export_package(ctx, mutate_package) do
    assert {:ok, export_run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, export_run} = CompanyTransfers.mark_export_run_running(export_run)
    assert {:ok, export_run} = Exporter.run(export_run)

    # Download blob to read and mutate package
    export_run = Repo.preload(export_run, :json_blob)
    temp_export_path = Path.join(System.tmp_dir!(), "export_#{export_run.id}.json")
    :ok = Operately.Blobs.download_blob_to_file(export_run.json_blob, temp_export_path)

    package =
      temp_export_path
      |> PackageJson.read!()
      |> mutate_package.()

    File.rm!(temp_export_path)
    package
  end

  defp stage_import(account, package) do
    assert {:ok, import_run} = CompanyTransfers.create_import_run(account, %{}, dispatch: false)
    assert {:ok, import_run, workspace} = CompanyTransfers.prepare_import_workspace(import_run)
    _json_meta = PackageJson.write!(workspace.json_path, package)

    Operately.Support.CompanyTransfer.Helpers.upload_import_artifacts_as_blobs(import_run, workspace, account)
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

  defp blob_document(blob) do
    %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "blob",
          "attrs" => %{
            "id" => WebPaths.blob_id(blob),
            "src" => Blob.url(blob),
            "title" => blob.filename,
            "filetype" => blob.content_type
          }
        }
      ]
    }
  end

  defp upload_blob_payload!(blob, content) do
    source_path = Path.join(System.tmp_dir!(), "blob-payload-#{blob.id}")
    File.write!(source_path, content)
    assert {:ok, _blob} = BlobIO.upload_to_blob(blob, source_path)
    File.rm!(source_path)
  end

  defp cleanup_blob_storage(blobs) do
    Enum.each(blobs, fn blob ->
      _ = File.rm(storage_path(blob))
    end)
  end

  defp storage_path(%Blob{} = blob) do
    Path.join("/media", Blob.path(blob))
  end

  defp create_transfer_activity!(author, action, content) do
    multi =
      Ecto.Multi.new()
      |> Activities.insert_sync(author.id, action, fn _ -> content end, include_notification: false)

    {:ok, %{updated_activity: activity}} = Repo.transaction(multi)
    activity
  end

  defp activity_row!(package, action) do
    package
    |> Map.fetch!("tables")
    |> Enum.find(&(&1["name"] == "activities"))
    |> Map.get("rows", [])
    |> Enum.find(&(&1["action"] == action))
    |> case do
      nil -> raise "Activity #{inspect(action)} not found in package"
      row -> row
    end
  end
end
