defmodule Operately.Operations.ProjectPermissionsEditingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)

    attrs = %{
      company_id: company.id,
      creator_id: creator.id,
      group_id: space.id,
      space_access_level: Binding.edit_access(),
      company_access_level: Binding.comment_access(),
      anonymous_access_level: Binding.view_access(),
    }

    {:ok, company: company, space: space, creator: creator, attrs: attrs}
  end

  test "ProjectPermissionsEditing operation edits bindings", ctx do
    project = project_fixture(ctx.attrs)

    Operately.Operations.ProjectPermissionsEditing.run(ctx.creator, project, %{
      public: Binding.no_access(),
      company: Binding.view_access(),
      space: Binding.full_access(),
    })

    context = Access.get_context!(project_id: project.id)

    public = Access.get_group!(company_id: ctx.company.id, tag: :anonymous)
    company = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    space = Access.get_group!(group_id: ctx.space.id, tag: :standard)

    assert Access.get_binding(context_id: context.id, group_id: public.id, access_level: Binding.no_access())
    assert Access.get_binding(context_id: context.id, group_id: company.id, access_level: Binding.view_access())
    assert Access.get_binding(context_id: context.id, group_id: space.id, access_level: Binding.full_access())
  end

  test "ProjectPermissionsEditing operation ignores company space", ctx do
    attrs = Map.merge(ctx.attrs, %{
      group_id: ctx.company.company_space_id
    })
    project = project_fixture(attrs)

    Operately.Operations.ProjectPermissionsEditing.run(ctx.creator, project, %{
      public: Binding.no_access(),
      company: Binding.view_access(),
      space: Binding.full_access(),
    })

    refute Access.get_group(group_id: project.group_id, tag: :standard)
  end

  test "ProjectPermissionsEditing operation creates activity", ctx do
    project = project_fixture(ctx.attrs)

    Operately.Operations.ProjectPermissionsEditing.run(ctx.creator, project, %{
      public: Binding.no_access(),
      company: Binding.view_access(),
      space: Binding.full_access(),
    })

    activity = from(a in Activity, where: a.action == "project_permissions_edited" and a.content["project_id"] == ^project.id) |> Repo.one!()

    assert activity.content["previous_permissions"]["public"] == Binding.view_access()
    assert activity.content["previous_permissions"]["company"] == Binding.comment_access()
    assert activity.content["previous_permissions"]["space"] == Binding.edit_access()

    assert activity.content["new_permissions"]["space"] == Binding.full_access()
    assert activity.content["new_permissions"]["company"] == Binding.view_access()
    assert activity.content["new_permissions"]["public"] == Binding.no_access()
  end
end
