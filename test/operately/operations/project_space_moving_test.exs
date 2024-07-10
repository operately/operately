defmodule Operately.Operations.ProjectSpaceMovingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    space = group_fixture(creator)
    new_space = group_fixture(creator)

    attrs = %{
      company_id: company.id,
      creator_id: creator.id,
      group_id: space.id,
      space_access_level: Binding.edit_access(),
    }

    {:ok, company: company, space: space, new_space: new_space, creator: creator, attrs: attrs}
  end

  test "ProjectSpaceMoving operation changes project's space", ctx do
    project = project_fixture(ctx.attrs)

    {:ok, updated_project} = Operately.Operations.ProjectSpaceMoving.run(ctx.creator, project, ctx.new_space.id)

    assert project.group_id == ctx.space.id
    assert updated_project.group_id == ctx.new_space.id
  end

  test "ProjectSpaceMoving operation creates binding to new space and deletes old binding", ctx do
    project = project_fixture(ctx.attrs)
    context = Access.get_context!(project_id: project.id)

    old_space_group = Access.get_group!(group_id: ctx.space.id, tag: :standard)
    new_space_group = Access.get_group!(group_id: ctx.new_space.id, tag: :standard)

    assert Access.get_binding(context_id: context.id, group_id: old_space_group.id, access_level: Binding.edit_access())
    refute Access.get_binding(context_id: context.id, group_id: new_space_group.id)

    Operately.Operations.ProjectSpaceMoving.run(ctx.creator, project, ctx.new_space.id)

    refute Access.get_binding(context_id: context.id, group_id: old_space_group.id)
    assert Access.get_binding(context_id: context.id, group_id: new_space_group.id, access_level: Binding.edit_access())
  end

  test "ProjectSpaceMoving operation ignores new space when it's the company's space and deletes old binding", ctx do
    project = project_fixture(ctx.attrs)
    context = Access.get_context!(project_id: project.id)

    unused_space_group = Access.get_group!(group_id: ctx.new_space.id, tag: :standard)
    old_space_group = Access.get_group!(group_id: ctx.space.id, tag: :standard)

    refute Access.get_binding(context_id: context.id, group_id: unused_space_group.id)
    assert Access.get_binding(context_id: context.id, group_id: old_space_group.id, access_level: Binding.edit_access())

    Operately.Operations.ProjectSpaceMoving.run(ctx.creator, project, ctx.company.company_space_id)

    refute Access.get_binding(context_id: context.id, group_id: unused_space_group.id)
    refute Access.get_binding(context_id: context.id, group_id: old_space_group.id)
  end

  test "ProjectSpaceMoving operation creates binding to new space and ignores old space when it's the company's space", ctx do
    project = project_fixture(Map.merge(ctx.attrs, %{group_id: ctx.company.company_space_id}))
    context = Access.get_context!(project_id: project.id)

    unused_space_group = Access.get_group!(group_id: ctx.space.id, tag: :standard)
    new_space_group = Access.get_group!(group_id: ctx.new_space.id, tag: :standard)

    refute Access.get_binding(context_id: context.id, group_id: unused_space_group.id)
    refute Access.get_binding(context_id: context.id, group_id: new_space_group.id)

    Operately.Operations.ProjectSpaceMoving.run(ctx.creator, project, ctx.new_space.id)

    refute Access.get_binding(context_id: context.id, group_id: unused_space_group.id)
    assert Access.get_binding(context_id: context.id, group_id: new_space_group.id, access_level: Binding.no_access())
  end

  test "ProjectSpaceMoving operation creates activity and notification", ctx do
    champion = person_fixture_with_account(%{company_id: ctx.company.id})
    reviewer = person_fixture_with_account(%{company_id: ctx.company.id})

    attrs = Map.merge(ctx.attrs, %{
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      creator_is_contributor: "no",
    })

    {:ok, project} = Oban.Testing.with_testing_mode(:manual, fn ->
      project = project_fixture(attrs)
      Operately.Operations.ProjectSpaceMoving.run(ctx.creator, project, ctx.new_space.id)
    end)

    activity = from(a in Activity, where: a.action == "project_moved" and a.content["project_id"] == ^project.id) |> Repo.one()

    assert notifications_count() == 0

    perform_job(activity.id)

    assert fetch_notifications(activity.id)
    assert notifications_count() == 2
  end
end
