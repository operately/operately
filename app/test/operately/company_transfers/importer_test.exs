defmodule Operately.CompanyTransfers.ImporterTest do
  use Operately.DataCase
  import Ecto.Query, only: [from: 2]

  alias Operately.Activities
  alias Operately.Activities.Activity
  alias Operately.Access
  alias Operately.Access.{Binding, GroupMembership}
  alias Operately.Blobs
  alias Operately.Blobs.Blob
  alias Operately.Companies.Company
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.{Exporter, Importer}
  alias Operately.InviteLinks
  alias Operately.CompanyTransfers.Package.{Archive, Limits, PackageJson, Paths}
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.People
  alias Operately.People.Account
  alias Operately.People.Person
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.Project
  alias Operately.ResourceHubs.Document
  alias Operately.ResourceHubs.DocumentVersion
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

  test "run/1 rejects package columns that are not backed by the table schema", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    company_count_before = Repo.aggregate(Company, :count, :id)

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               add_unknown_company_column(package, "not_a_real_column", "not a real value")
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:error, {:unknown_columns, "companies", ["not_a_real_column"]}} = Importer.run(import_run)
    assert Repo.aggregate(Company, :count, :id) == company_count_before
  end

  test "run/1 rejects import artifacts that exceed configured size limits", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, json_limited_run} = export_and_stage_import(ctx)
    assert {:ok, json_limited_run} = CompanyTransfers.mark_import_run_running(json_limited_run)

    with_package_limits([max_json_size_bytes: 1], fn ->
      assert {:error, {:package_limit_exceeded, :max_json_size_bytes, 1, actual}} = Importer.run(json_limited_run)
      assert actual > 1
    end)

    assert {:ok, zip_limited_run} = export_and_stage_import(ctx)
    assert {:ok, zip_limited_run} = CompanyTransfers.mark_import_run_running(zip_limited_run)

    with_package_limits([max_zip_size_bytes: 1], fn ->
      assert {:error, {:package_limit_exceeded, :max_zip_size_bytes, 1, actual}} = Importer.run(zip_limited_run)
      assert actual > 1
    end)
  end

  test "run/1 fails when the package is missing data.json", ctx do
    assert {:ok, import_run} = CompanyTransfers.create_import_run(ctx.account, %{}, dispatch: false)
    assert {:ok, import_run, workspace} = CompanyTransfers.prepare_import_workspace(import_run)

    Archive.create!(workspace.zip_path, [
      {"files/blobs/blob-1/file.txt", "payload"}
    ])

    assert {:ok, import_run} = stage_package_blob(import_run, ctx.account, workspace.zip_path)
    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:error, {:exception, message}} = Importer.run(import_run)
    assert message =~ "Archive does not contain data.json"
  end

  test "run/1 fails when data.json is invalid JSON", ctx do
    assert {:ok, import_run} = CompanyTransfers.create_import_run(ctx.account, %{}, dispatch: false)
    assert {:ok, import_run, workspace} = CompanyTransfers.prepare_import_workspace(import_run)

    Archive.create!(workspace.zip_path, [
      {"data.json", "{invalid"}
    ])

    assert {:ok, import_run} = stage_package_blob(import_run, ctx.account, workspace.zip_path)
    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:error, {:exception, message}} = Importer.run(import_run)
    assert message =~ "unexpected byte"
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

  test "run/1 makes the imported importer person an owner", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:member, has_open_invitation: false)

    import_account = Repo.get!(Account, ctx.member.account_id)

    refute Company.is_owner?(ctx.company, ctx.member)

    assert {:ok, import_run} = export_and_stage_import_as(ctx, import_account)
    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_company = Repo.get!(Company, completed_run.company_id)
    imported_importer = People.get_person!(import_account, imported_company)

    assert imported_importer.email == ctx.member.email
    assert Company.is_owner?(imported_company, imported_importer)
  end

  test "run/1 creates an owner person when the importer was not in the package", ctx do
    import_account =
      Operately.PeopleFixtures.account_fixture(%{
        full_name: "Destination Importer",
        email: "destination-importer-#{System.unique_integer([:positive])}@example.com"
      })

    ctx = Factory.add_company(ctx, :destination_company, import_account, name: "Destination Company")

    assert {:ok, import_run} = export_and_stage_import_as(ctx, import_account)
    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_company = Repo.get!(Company, completed_run.company_id)
    imported_importer = People.get_person!(import_account, imported_company)

    assert imported_importer.full_name == import_account.full_name
    assert imported_importer.email == import_account.email
    assert Company.is_owner?(imported_company, imported_importer)
  end

  test "run/1 keeps owner finalization idempotent when the importer is already an owner", ctx do
    assert {:ok, import_run} = export_and_stage_import(ctx)
    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_company = Repo.get!(Company, completed_run.company_id)
    imported_importer = People.get_person!(ctx.account, imported_company)

    assert Company.is_owner?(imported_company, imported_importer)
    assert owner_group_membership_count(imported_company, imported_importer) == 1
    assert personal_owner_binding_count(imported_company, imported_importer) == 1
  end

  test "run/1 emails imported people, excludes the importer, and creates invite links for newly created accounts", ctx do
    ctx =
      ctx
      # This account has already logged in, so import should treat it as reusable
      # without issuing a fresh personal invite link.
      |> Factory.add_company_member(:member, has_open_invitation: false)
      |> Factory.add_company_member(:new_member)
      |> Factory.add_outside_collaborator(:guest, :creator)

    imported_new_member_email = "imported-member-#{System.unique_integer([:positive])}@example.com"
    imported_new_member_name = "Imported #{ctx.new_member.full_name}"
    imported_guest_email = "imported-guest-#{System.unique_integer([:positive])}@example.com"
    imported_guest_name = "Imported #{ctx.guest.full_name}"

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               package
               |> replace_account_email(ctx.new_member.account_id, imported_new_member_email, imported_new_member_name)
               |> replace_person_email(ctx.new_member.id, imported_new_member_email, imported_new_member_name)
               |> replace_account_email(ctx.guest.account_id, imported_guest_email, imported_guest_name)
               |> replace_person_email(ctx.guest.id, imported_guest_email, imported_guest_name)
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_company = Repo.get!(Company, completed_run.company_id)
    imported_creator = People.get_person!(ctx.account, imported_company)
    imported_member = Repo.get_by!(Person, company_id: imported_company.id, email: ctx.member.email)
    imported_new_member = Repo.get_by!(Person, company_id: imported_company.id, email: imported_new_member_email)
    imported_guest = Repo.get_by!(Person, company_id: imported_company.id, email: imported_guest_email)

    login_url = WebPaths.login_path() |> WebPaths.to_url()
    {:ok, new_member_invite_link} = InviteLinks.get_personal_invite_link_for_person(imported_new_member.id)
    {:ok, invite_link} = InviteLinks.get_personal_invite_link_for_person(imported_guest.id)
    new_member_invite_url = WebPaths.join_path(new_member_invite_link.token) |> WebPaths.to_url()
    invite_url = WebPaths.join_path(invite_link.token) |> WebPaths.to_url()

    assert new_member_invite_link.author_id == imported_creator.id
    assert invite_link.author_id == imported_creator.id

    importer_short_name = Person.short_name(imported_creator)

    # Reused accounts should be notified without getting a fresh personal invite link.
    assert {:error, :not_found} = InviteLinks.get_personal_invite_link_for_person(imported_member.id)

    member_email = imported_member.email
    new_member_email = imported_new_member.email
    guest_email = imported_guest.email
    creator_email = ctx.creator.email

    # Existing destination accounts get the standard "added to company" email path.
    assert_received {:email, %{to: [{_, ^member_email}], text_body: member_text_body}}
    assert member_text_body =~ importer_short_name
    assert member_text_body =~ "added you as a company member"
    assert member_text_body =~ login_url
    refute String.contains?(member_text_body, "/join?token=")

    # Newly created company members get the first-login invite path too.
    assert_received {:email, %{to: [{_, ^new_member_email}], text_body: new_member_text_body}}
    assert new_member_text_body =~ importer_short_name
    assert new_member_text_body =~ "invited you to join #{imported_company.name}"
    assert new_member_text_body =~ new_member_invite_url

    # Newly created destination accounts get the first-login invite path.
    assert_received {:email, %{to: [{_, ^guest_email}], text_body: guest_text_body}}
    assert guest_text_body =~ importer_short_name
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

  test "run/1 fails when a message author_id cannot be translated", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:message, :board)

    missing_author_id = Ecto.UUID.generate()

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               Transfers.update_row(package, "messages", ctx.message.id, &Map.put(&1, "author_id", missing_author_id))
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:error, {:missing_reference_translation, "messages", "author_id", "people", ^missing_author_id}} = Importer.run(import_run)
  end

  test "run/1 fails when a goal update author_id cannot be translated", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:goal_update, :goal, :creator)

    missing_author_id = Ecto.UUID.generate()

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               Transfers.update_row(package, "goal_updates", ctx.goal_update.id, &Map.put(&1, "author_id", missing_author_id))
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)

    assert {:error, {:missing_reference_translation, "goal_updates", "author_id", "people", ^missing_author_id}} = Importer.run(import_run)
  end

  test "run/1 clears goal update acknowledgment fields when acknowledged_by_id cannot be translated", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:reviewer)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:goal_update, :goal, :creator)
      |> Factory.acknowledge_goal_update(:goal_update, :reviewer)

    missing_acknowledger_id = Ecto.UUID.generate()

    assert {:ok, import_run} =
             export_and_stage_import(ctx, fn package ->
               Transfers.update_row(package, "goal_updates", ctx.goal_update.id, &Map.put(&1, "acknowledged_by_id", missing_acknowledger_id))
             end)

    assert {:ok, import_run} = CompanyTransfers.mark_import_run_running(import_run)
    assert {:ok, completed_run} = Importer.run(import_run)

    imported_goal =
      Repo.one!(
        from g in Goal,
          join: s in assoc(g, :group),
          where: s.company_id == ^completed_run.company_id,
          where: g.name == ^ctx.goal.name
      )

    imported_update = Repo.get_by!(Update, goal_id: imported_goal.id)

    assert imported_update.acknowledged_by_id == nil
    assert imported_update.acknowledged_at == nil
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
                 package_blob_id: export_run.package_blob_id
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
          where: d.name == "Document"
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

  test "run/1 round-trips document versions including historical-only blobs", ctx do
    ctx =
      ctx
      |> Factory.add_blob(:historical_blob)
      |> Factory.add_company_member(:editor)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, name: "Versioned Doc", content: %{"type" => "doc", "content" => []})

    on_exit(fn ->
      cleanup_blob_storage([ctx.historical_blob])
    end)

    upload_blob_payload!(ctx.historical_blob, "historical-only payload")

    assert {:ok, _} =
             Operately.ResourceHubs.create_document_version(%{
               document_id: ctx.document.id,
               version_number: 1,
               title: "Baseline title",
               content: %{"type" => "doc", "content" => []},
               content_schema_version: 1,
               editor_id: nil,
               origin: :migration,
               inserted_at: ~U[2024-01-01 10:00:00Z]
             })

    assert {:ok, _} =
             Operately.ResourceHubs.create_document_version(%{
               document_id: ctx.document.id,
               version_number: 2,
               title: "Edited title",
               content: blob_document(ctx.historical_blob),
               content_schema_version: 1,
               editor_id: ctx.editor.id,
               origin: :edited,
               inserted_at: ~U[2024-01-02 11:00:00Z]
             })

    assert {:ok, _} =
             Operately.ResourceHubs.create_document_version(%{
               document_id: ctx.document.id,
               version_number: 3,
               title: "Restored title",
               content: %{"type" => "doc", "content" => []},
               content_schema_version: 1,
               editor_id: ctx.editor.id,
               origin: :restored,
               restored_from_version_number: 1,
               inserted_at: ~U[2024-01-03 12:00:00Z]
             })

    {:ok, document} =
      ctx.document
      |> Ecto.Changeset.change(%{current_version: 3})
      |> Repo.update()

    ctx = Map.put(ctx, :document, document)

    assert {:ok, export_run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, export_run} = CompanyTransfers.mark_export_run_running(export_run)
    assert {:ok, export_run} = Exporter.run(export_run)

    assert {:ok, import_run} =
             CompanyTransfers.create_import_run(
               ctx.account,
               %{
                 package_blob_id: export_run.package_blob_id
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
          where: d.name == "Versioned Doc"
      )

    assert imported_document.current_version == 3
    assert imported_document.id != ctx.document.id

    imported_versions =
      from(v in DocumentVersion,
        where: v.document_id == ^imported_document.id,
        order_by: [asc: v.version_number]
      )
      |> Repo.all()

    assert length(imported_versions) == 3
    assert Enum.map(imported_versions, & &1.version_number) == [1, 2, 3]
    assert Enum.map(imported_versions, & &1.origin) == [:migration, :edited, :restored]
    assert Enum.at(imported_versions, 2).restored_from_version_number == 1
    assert Enum.at(imported_versions, 0).content_schema_version == 1
    assert Enum.at(imported_versions, 0).editor_id == nil
    assert Enum.at(imported_versions, 1).editor_id != nil
    assert Enum.at(imported_versions, 1).editor_id != ctx.editor.id

    [imported_blob_id] = Operately.RichContent.Blob.find_ids(Enum.at(imported_versions, 1).content)
    imported_blob = Blobs.get_blob!(imported_blob_id)

    assert imported_blob.id != ctx.historical_blob.id
    assert File.read!(storage_path(imported_blob)) == "historical-only payload"

    _ = File.rm(storage_path(imported_blob))
  end

  defp export_and_stage_import(ctx, mutate_package \\ & &1) do
    export_and_stage_import_as(ctx, ctx.account, mutate_package)
  end

  defp export_and_stage_import_as(ctx, account, mutate_package \\ & &1) do
    package = export_package(ctx, mutate_package)
    stage_import(account, package)
  end

  defp owner_group_membership_count(%Company{} = company, %Person{} = person) do
    owner_group = Access.get_group!(company_id: company.id, tag: :full_access)

    Repo.aggregate(
      from(m in GroupMembership,
        where: m.group_id == ^owner_group.id,
        where: m.person_id == ^person.id
      ),
      :count,
      :id
    )
  end

  defp personal_owner_binding_count(%Company{} = company, %Person{} = person) do
    context = Access.get_context!(company_id: company.id)
    person_group = Access.get_group!(person_id: person.id)

    Repo.aggregate(
      from(b in Binding,
        where: b.context_id == ^context.id,
        where: b.group_id == ^person_group.id,
        where: b.access_level == ^Binding.full_access()
      ),
      :count,
      :id
    )
  end

  defp export_package(ctx, mutate_package) do
    assert {:ok, export_run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, export_run} = CompanyTransfers.mark_export_run_running(export_run)
    assert {:ok, export_run} = Exporter.run(export_run)

    # Download blob to read and mutate package
    export_run = Repo.preload(export_run, :package_blob)
    temp_export_path = Path.join(System.tmp_dir!(), "export_#{export_run.id}.zip")
    :ok = Operately.Blobs.download_blob_to_file(export_run.package_blob, temp_export_path)

    package =
      temp_export_path
      |> Archive.read_entry!("data.json")
      |> Jason.decode!()
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

  defp add_unknown_company_column(package, column, value) do
    update_in(package, ["tables"], fn tables ->
      Enum.map(tables, fn table ->
        if table["name"] == "companies" do
          update_in(table, ["rows"], fn rows ->
            Enum.map(rows, &Map.put(&1, column, value))
          end)
        else
          table
        end
      end)
    end)
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

  defp with_package_limits(limits, fun) do
    original = Application.get_env(:operately, Limits)

    defaults = %{
      max_json_size_bytes: 1_000_000_000,
      max_zip_size_bytes: 1_000_000_000,
      max_extracted_file_size_bytes: 1_000_000_000,
      max_files_count: 1_000_000,
      max_rows_count: 1_000_000,
      max_tables_count: 1_000
    }

    merged_limits = Map.merge(defaults, Map.new(limits))
    Application.put_env(:operately, Limits, merged_limits)

    try do
      fun.()
    after
      if original == nil do
        Application.delete_env(:operately, Limits)
      else
        Application.put_env(:operately, Limits, original)
      end
    end
  end

  defp stage_package_blob(import_run, account, package_path) do
    {:ok, package_blob} =
      Operately.Blobs.create_blob(%{
        purpose: :company_transfer_import_artifact,
        account_id: account.id,
        status: :pending,
        filename: Path.basename(package_path),
        size: File.stat!(package_path).size,
        content_type: "application/zip"
      })

    {:ok, package_blob} = BlobIO.upload_to_blob(package_blob, package_path)
    CompanyTransfers.update_import_run(import_run, %{package_blob_id: package_blob.id})
  end
end
