defmodule Operately.Features.CompanyTransfersPermissionsTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Package.Paths
  alias Operately.Support.Features.CompanyTransfersPermissionsSteps, as: Steps

  setup ctx do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    Steps.setup(ctx)
  end

  test "company roles and member permissions survive an import", ctx do
    ctx
    |> Steps.given_company_owner_admin_and_regular_members()
    |> Steps.given_space_with_company_view_access()
    |> Steps.given_resources_with_company_and_space_inherited_access()
    |> Steps.given_resources_that_require_direct_access()
    |> Steps.given_space_members_with_all_access_levels()
    |> Steps.given_company_members_for_direct_resource_access()
    |> Steps.given_direct_resource_grants_for_all_access_levels()
    |> Steps.when_company_is_transferred_with_one_new_account()
    |> Steps.then_source_member_permissions_match_expected()
    |> Steps.then_imported_member_permissions_match_source()
    |> Steps.then_new_account_member_is_created()
  end

  test "guest permissions stay restricted and direct grants survive an import", ctx do
    ctx
    |> Steps.given_company_owner_who_invites_guest()
    |> Steps.given_space_with_company_view_access()
    |> Steps.given_resources_with_company_and_space_inherited_access()
    |> Steps.given_resources_that_require_direct_access()
    |> Steps.given_guest_with_minimal_company_access()
    |> Steps.given_guest_direct_access_to_specific_resources()
    |> Steps.when_company_is_transferred()
    |> Steps.then_source_guest_permissions_match_expected()
    |> Steps.then_imported_guest_permissions_match_source()
  end
end
