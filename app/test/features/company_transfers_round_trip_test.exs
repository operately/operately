defmodule Operately.Features.CompanyTransfersRoundTripTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Package.Paths
  alias Operately.Support.Features.CompanyTransfersRoundTripSteps, as: Steps

  setup ctx do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    Steps.setup(ctx)
  end

  test "permissions and deferred references survive a round trip", ctx do
    ctx
    |> Steps.given_permissions_and_deferred_reference_company()
    |> Steps.when_company_round_trips()
    |> Steps.then_permissions_and_deferred_references_match()
  end

  test "rolls the import back when a later foreign key cannot be translated", ctx do
    ctx
    |> Steps.given_project_company_for_failed_import()
    |> Steps.when_import_uses_missing_project_creator()
    |> Steps.then_import_is_rolled_back()
  end

  test "re-exported packages keep table counts and core relationships for a rich minimal-slice company", ctx do
    ctx
    |> Steps.given_rich_minimal_slice_company()
    |> Steps.when_company_round_trips()
    |> Steps.then_core_minimal_slice_data_matches()
  end

  test "milestone comments survive a round trip", ctx do
    ctx
    |> Steps.given_company_with_milestone_comment()
    |> Steps.when_company_round_trips()
    |> Steps.then_milestone_comments_survive()
  end

  test "imports into a destination with unrelated companies and multiple existing accounts", ctx do
    ctx
    |> Steps.given_company_for_existing_account_import()
    |> Steps.given_destination_with_existing_accounts()
    |> Steps.when_import_targets_existing_destination_accounts()
    |> Steps.then_existing_account_is_reused_without_touching_unrelated_people()
  end

  test "activity export/import rewrites content ids and preserves missing serialized ids", ctx do
    ctx
    |> Steps.given_company_with_activity_content_ids()
    |> Steps.when_activity_content_round_trips_with_missing_serialized_person()
    |> Steps.then_activity_content_ids_are_rewritten_and_missing_ids_preserved()
  end

  test "comment threads, comments, and reactions survive a round trip", ctx do
    ctx
    |> Steps.given_company_with_polymorphic_threads_comments_and_reactions()
    |> Steps.when_company_round_trips()
    |> Steps.then_polymorphic_graph_survives()
  end

  @tag ownership_timeout: 180_000
  test "avatars, resource files, previews, and rich-text attachments survive a round trip under local storage", ctx do
    previous_storage_type = Application.get_env(:operately, :storage_type)
    Application.put_env(:operately, :storage_type, "local")

    on_exit(fn ->
      Application.put_env(:operately, :storage_type, previous_storage_type)
    end)

    ctx
    |> Steps.given_company_with_file_slice_resources()
    |> Steps.when_company_round_trips()
    |> Steps.then_file_slice_survives_under_local_storage()
  end

  @tag ownership_timeout: 180_000
  test "soft-deleted resource files survive a round trip under local storage", ctx do
    previous_storage_type = Application.get_env(:operately, :storage_type)
    Application.put_env(:operately, :storage_type, "local")

    on_exit(fn ->
      Application.put_env(:operately, :storage_type, previous_storage_type)
    end)

    ctx
    |> Steps.given_company_with_soft_deleted_file_slice_resources()
    |> Steps.when_company_round_trips()
    |> Steps.then_soft_deleted_file_slice_survives_under_local_storage()
  end

  @tag ownership_timeout: 180_000
  test "a demo-built company can round-trip across the minimal slice", ctx do
    previous_demo_setting = Application.get_env(:operately, :demo_builder_allowed)
    Application.put_env(:operately, :demo_builder_allowed, true)

    on_exit(fn ->
      Application.put_env(:operately, :demo_builder_allowed, previous_demo_setting)
    end)

    ctx
    |> Steps.given_demo_built_company()
    |> Steps.when_demo_company_round_trips()
    |> Steps.then_demo_slice_matches()
  end
end
