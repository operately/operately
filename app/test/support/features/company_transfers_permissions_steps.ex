defmodule Operately.Support.Features.CompanyTransfersPermissionsSteps do
  import Ecto.Query
  import ExUnit.Assertions
  import Operately.FeatureSteps

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Access.Fetch
  alias Operately.Companies
  alias Operately.Companies.Company
  alias Operately.Goals.Goal
  alias Operately.Groups
  alias Operately.Groups.Group
  alias Operately.People.Person
  alias Operately.Projects
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Support.CompanyTransfer.Helpers, as: Transfers
  alias Operately.Support.Factory

  step :setup, ctx do
    Factory.setup(ctx)
  end

  step :given_company_owner_admin_and_regular_members, ctx do
    ctx
    |> Factory.add_company_member(:owner, name: "Transfer Owner")
    |> promote_to_owner(:owner)
    |> Factory.add_company_member(:admin, name: "Transfer Admin")
    |> promote_to_admin(:admin)
    |> Factory.add_company_member(:member, name: "Transfer Member")
    |> Factory.add_company_member(:new_account_member, name: "Transfer New Account Member")
  end

  step :given_company_members_for_direct_resource_access, ctx do
    ctx
    |> Factory.add_company_member(:direct_viewer, name: "Direct Viewer")
    |> Factory.add_company_member(:direct_commenter, name: "Direct Commenter")
    |> Factory.add_company_member(:direct_editor, name: "Direct Editor")
    |> Factory.add_company_member(:direct_full_access, name: "Direct Full Access")
  end

  step :given_space_with_company_view_access, ctx do
    ctx
    |> Factory.add_space(:space, name: "Transfer Permission Space", company_permissions: Binding.view_access())
  end

  step :given_space_members_with_all_access_levels, ctx do
    ctx
    |> Factory.add_space_member(:space_viewer, :space, name: "Space Viewer", permissions: :view_access)
    |> Factory.add_space_member(:space_commenter, :space, name: "Space Commenter", permissions: :comment_access)
    |> Factory.add_space_member(:space_editor, :space, name: "Space Editor", permissions: :edit_access)
    |> Factory.add_space_member(:space_manager, :space, name: "Space Manager", permissions: :full_access)
  end

  step :given_resources_with_company_and_space_inherited_access, ctx do
    ctx
    |> add_inherited_permission_resources()
  end

  step :given_resources_that_require_direct_access, ctx do
    ctx
    |> add_direct_permission_resources()
  end

  step :given_direct_resource_grants_for_all_access_levels, ctx do
    ctx
    |> bind_direct_resource_access(:direct_viewer, Binding.view_access())
    |> bind_direct_resource_access(:direct_commenter, Binding.comment_access())
    |> bind_direct_resource_access(:direct_editor, Binding.edit_access())
    |> bind_direct_resource_access(:direct_full_access, Binding.full_access())
  end

  step :given_company_owner_who_invites_guest, ctx do
    ctx
    |> Factory.add_company_owner(:owner, name: "Guest Inviter")
  end

  step :given_guest_with_minimal_company_access, ctx do
    ctx
    |> Factory.add_outside_collaborator(:guest, :owner, name: "Restricted Guest")
  end

  step :given_guest_direct_access_to_specific_resources, ctx do
    ctx
    |> bind_project_access(:guest, :direct_project, Binding.comment_access())
    |> bind_goal_access(:guest, :direct_goal, Binding.view_access())
    |> bind_resource_hub_access(:guest, :direct_hub, Binding.edit_access())
  end

  step :when_company_is_transferred, ctx do
    transfer_company(ctx, & &1)
  end

  step :when_company_is_transferred_with_one_new_account, ctx do
    imported_email = "transfer-new-account-#{System.unique_integer([:positive])}@example.com"

    transfer_company(ctx, fn package ->
      package
      |> Transfers.replace_account_email(ctx.new_account_member.account_id, imported_email, ctx.new_account_member.full_name)
      |> Transfers.replace_person_email(ctx.new_account_member.id, imported_email, ctx.new_account_member.full_name)
    end)
    |> Map.put(:new_account_member_import_email, imported_email)
  end

  step :then_source_member_permissions_match_expected, ctx do
    source_snapshot = permission_snapshot(ctx.company, member_people(ctx), permission_resources())

    assert source_snapshot == member_expected_snapshot()

    Map.put(ctx, :source_member_permission_snapshot, source_snapshot)
  end

  step :then_imported_member_permissions_match_source, ctx do
    imported_snapshot = permission_snapshot(ctx.imported_company, member_people(ctx), permission_resources())

    assert imported_snapshot == ctx.source_member_permission_snapshot

    ctx
  end

  step :then_new_account_member_is_created, ctx do
    assert_new_account_member_was_created(ctx)

    ctx
  end

  step :then_source_guest_permissions_match_expected, ctx do
    source_snapshot = permission_snapshot(ctx.company, guest_people(ctx), permission_resources())

    assert source_snapshot == guest_expected_snapshot()

    Map.put(ctx, :source_guest_permission_snapshot, source_snapshot)
  end

  step :then_imported_guest_permissions_match_source, ctx do
    imported_snapshot = permission_snapshot(ctx.imported_company, guest_people(ctx), permission_resources())

    assert imported_snapshot == ctx.source_guest_permission_snapshot

    ctx
  end

  defp add_inherited_permission_resources(ctx) do
    ctx
    |> Factory.add_project(:inherited_project, :space,
      name: "Inherited Project",
      company_access_level: Binding.view_access(),
      space_access_level: Binding.comment_access()
    )
    |> Factory.add_goal(:inherited_goal, :space,
      name: "Inherited Goal",
      company_access: Binding.comment_access(),
      space_access: Binding.edit_access()
    )
    |> Factory.add_resource_hub(:inherited_hub, :space, :creator,
      name: "Inherited Resource Hub",
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
      anonymous_access_level: Binding.no_access()
    )
  end

  defp add_direct_permission_resources(ctx) do
    ctx
    |> Factory.add_project(:direct_project, :space,
      name: "Direct Project",
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access()
    )
    |> Factory.add_goal(:direct_goal, :space,
      name: "Direct Goal",
      company_access: Binding.no_access(),
      space_access: Binding.no_access()
    )
    |> Factory.add_resource_hub(:direct_hub, :space, :creator,
      name: "Direct Resource Hub",
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
      anonymous_access_level: Binding.no_access()
    )
  end

  defp transfer_company(ctx, mutate_package) do
    source = Transfers.export!(ctx.company, ctx.account)

    package =
      source.package
      |> Transfers.replace_company_short_id(unique_short_id())
      |> mutate_package.()

    imported = Transfers.run_import!(package, ctx.account, source_export_run: source.run)
    imported_company = Repo.get!(Company, imported.run.company_id)

    ctx
    |> Map.put(:transfer_source, source)
    |> Map.put(:transfer_imported, imported)
    |> Map.put(:imported_company, imported_company)
  end

  defp promote_to_owner(ctx, person_key) do
    person = Map.fetch!(ctx, person_key)
    {:ok, _} = Companies.add_owner(ctx.creator, person.id)
    ctx
  end

  defp promote_to_admin(ctx, person_key) do
    person = Map.fetch!(ctx, person_key)
    {:ok, _} = Companies.add_admins(ctx.creator, person.id)
    ctx
  end

  defp bind_direct_resource_access(ctx, person_key, level) do
    ctx
    |> bind_project_access(person_key, :direct_project, level)
    |> bind_goal_access(person_key, :direct_goal, level)
    |> bind_resource_hub_access(person_key, :direct_hub, level)
  end

  defp bind_project_access(ctx, person_key, project_key, level) do
    context = Access.get_context!(project_id: Map.fetch!(ctx, project_key).id)
    person = Map.fetch!(ctx, person_key)
    {:ok, _} = Access.bind_person(context, person.id, level)
    ctx
  end

  defp bind_goal_access(ctx, person_key, goal_key, level) do
    context = Access.get_context!(goal_id: Map.fetch!(ctx, goal_key).id)
    person = Map.fetch!(ctx, person_key)
    {:ok, _} = Access.bind_person(context, person.id, level)
    ctx
  end

  defp bind_resource_hub_access(ctx, person_key, hub_key, level) do
    context = Access.get_context!(group_id: Map.fetch!(ctx, hub_key).space_id)
    person = Map.fetch!(ctx, person_key)
    {:ok, _} = Access.bind_person(context, person.id, level)
    ctx
  end

  defp permission_snapshot(%Company{} = company, people, resources) do
    resource_records = resource_records(company, resources)

    Map.new(people, fn {role, person_name} ->
      person = Repo.get_by!(Person, company_id: company.id, full_name: person_name)

      {role,
       %{
         person_type: person.type,
         company: company_access_level(company, person),
         space: space_access_level(resource_records.space, person),
         inherited_project: project_access_level(resource_records.inherited_project, person),
         direct_project: project_access_level(resource_records.direct_project, person),
         inherited_goal: goal_access_level(resource_records.inherited_goal, person),
         direct_goal: goal_access_level(resource_records.direct_goal, person),
         inherited_hub: resource_hub_access_level(resource_records.inherited_hub, person),
         direct_hub: resource_hub_access_level(resource_records.direct_hub, person)
       }}
    end)
  end

  defp resource_records(%Company{} = company, resources) do
    space = Repo.get_by!(Group, company_id: company.id, name: resources.space)

    %{
      space: space,
      inherited_project: Repo.get_by!(Project, company_id: company.id, name: resources.inherited_project),
      direct_project: Repo.get_by!(Project, company_id: company.id, name: resources.direct_project),
      inherited_goal: Repo.get_by!(Goal, company_id: company.id, name: resources.inherited_goal),
      direct_goal: Repo.get_by!(Goal, company_id: company.id, name: resources.direct_goal),
      inherited_hub: Repo.get_by!(ResourceHub, space_id: space.id, name: resources.inherited_hub),
      direct_hub: Repo.get_by!(ResourceHub, space_id: space.id, name: resources.direct_hub)
    }
  end

  defp company_access_level(%Company{} = company, %Person{} = person) do
    person.id
    |> Companies.get_company_with_access_level(id: company.id)
    |> requester_access_level()
  end

  defp space_access_level(%Group{} = space, %Person{} = person) do
    space.id
    |> Groups.get_group_with_access_level(person.id)
    |> requester_access_level()
  end

  defp project_access_level(%Project{} = project, %Person{} = person) do
    project.id
    |> Projects.get_project_with_access_level(person.id)
    |> requester_access_level()
  end

  defp goal_access_level(%Goal{} = goal, %Person{} = person) do
    from(g in Goal, as: :resource, where: g.id == ^goal.id)
    |> Fetch.get_access_level(person.id)
  end

  defp resource_hub_access_level(%ResourceHub{} = hub, %Person{} = person) do
    person
    |> ResourceHub.get(id: hub.id)
    |> requester_access_level()
  end

  defp requester_access_level({:ok, %{request_info: %{access_level: access_level}}}), do: access_level
  defp requester_access_level({:ok, resource}), do: resource.requester_access_level
  defp requester_access_level({:error, :not_found}), do: Binding.no_access()

  defp member_people(ctx) do
    %{
      creator: ctx.creator.full_name,
      owner: "Transfer Owner",
      admin: "Transfer Admin",
      member: "Transfer Member",
      new_account_member: "Transfer New Account Member",
      space_viewer: "Space Viewer",
      space_commenter: "Space Commenter",
      space_editor: "Space Editor",
      space_manager: "Space Manager",
      direct_viewer: "Direct Viewer",
      direct_commenter: "Direct Commenter",
      direct_editor: "Direct Editor",
      direct_full_access: "Direct Full Access"
    }
  end

  defp guest_people(ctx) do
    %{guest: ctx.guest.full_name}
  end

  defp permission_resources do
    %{
      space: "Transfer Permission Space",
      inherited_project: "Inherited Project",
      direct_project: "Direct Project",
      inherited_goal: "Inherited Goal",
      direct_goal: "Direct Goal",
      inherited_hub: "Inherited Resource Hub",
      direct_hub: "Direct Resource Hub"
    }
  end

  defp member_expected_snapshot do
    view = Binding.view_access()
    comment = Binding.comment_access()
    edit = Binding.edit_access()
    admin = Binding.admin_access()
    full = Binding.full_access()
    none = Binding.no_access()

    %{
      creator: access(:human, full, full, full, full, full, full, full, full),
      owner: access(:human, full, full, full, full, full, full, full, full),
      admin: access(:human, admin, view, view, none, comment, none, view, view),
      member: access(:human, view, view, view, none, comment, none, view, view),
      new_account_member: access(:human, view, view, view, none, comment, none, view, view),
      space_viewer: access(:human, view, view, comment, none, edit, none, view, view),
      space_commenter: access(:human, view, comment, comment, none, edit, none, comment, comment),
      space_editor: access(:human, view, edit, comment, none, edit, none, edit, edit),
      space_manager: access(:human, view, full, full, full, full, full, full, full),
      direct_viewer: access(:human, view, view, view, view, comment, view, view, view),
      direct_commenter: access(:human, view, comment, view, comment, comment, comment, comment, comment),
      direct_editor: access(:human, view, edit, view, edit, comment, edit, edit, edit),
      direct_full_access: access(:human, view, full, view, full, comment, full, full, full)
    }
  end

  defp guest_expected_snapshot do
    %{
      guest:
        access(
          :guest,
          Binding.no_access(),
          Binding.edit_access(),
          Binding.no_access(),
          Binding.comment_access(),
          Binding.no_access(),
          Binding.view_access(),
          Binding.edit_access(),
          Binding.edit_access()
        )
    }
  end

  defp access(type, company, space, inherited_project, direct_project, inherited_goal, direct_goal, inherited_hub, direct_hub) do
    %{
      person_type: type,
      company: company,
      space: space,
      inherited_project: inherited_project,
      direct_project: direct_project,
      inherited_goal: inherited_goal,
      direct_goal: direct_goal,
      inherited_hub: inherited_hub,
      direct_hub: direct_hub
    }
  end

  defp assert_new_account_member_was_created(ctx) do
    imported_person = Repo.get_by!(Person, company_id: ctx.imported_company.id, full_name: ctx.new_account_member.full_name)

    assert imported_person.email == ctx.new_account_member_import_email
    assert imported_person.account_id != ctx.new_account_member.account_id
  end

  defp unique_short_id do
    5_000_000 + System.unique_integer([:positive])
  end
end
