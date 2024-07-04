defmodule Operately.Operations.ProjectCreationTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()

    creator = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})

    space = group_fixture(creator)

    project_attrs = %Operately.Operations.ProjectCreation{
      name: "my project",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      creator_is_contributor: "yes",
      creator_role: "developer",
      visibility: "everyone",
      creator_id: creator.id,
      company_id: company.id,
      group_id: space.id,
      anonymous_access_level: Binding.view_access(),
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
    }

    {:ok, company: company, space: space, creator: creator, reviewer: reviewer, champion: champion, project_attrs: project_attrs}
  end

  test "ProjectCreation operation creates project", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    contributors = Projects.list_project_contributors(project)

    assert 3 == length(contributors)

    contributors = Enum.map(contributors, fn contributor -> {contributor.person_id, contributor.role} end)

    assert Enum.member?(contributors, {ctx.creator.id, :contributor})
    assert Enum.member?(contributors, {ctx.reviewer.id, :reviewer})
    assert Enum.member?(contributors, {ctx.champion.id, :champion})
  end

  test "ProjectCreation operation creates bindings to company", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    context = Access.get_context!(project_id: project.id)

    full_access = Access.get_group!(company_id: ctx.company.id, tag: :full_access)
    members = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    anonymous = Access.get_group!(company_id: ctx.company.id, tag: :anonymous)

    assert Access.get_binding(group_id: full_access.id, context_id: context.id, access_level: Binding.full_access())
    assert Access.get_binding(group_id: members.id, context_id: context.id, access_level: Binding.comment_access())
    assert Access.get_binding(group_id: anonymous.id, context_id: context.id, access_level: Binding.view_access())
  end

  test "ProjectCreation operation creates bindings to space", ctx do
    {:ok, project} = Operately.Operations.ProjectCreation.run(ctx.project_attrs)

    context = Access.get_context!(project_id: project.id)
    full_access = Access.get_group!(group_id: ctx.space.id, tag: :full_access)
    members = Access.get_group!(group_id: ctx.space.id, tag: :standard)

    assert Access.get_binding(group_id: full_access.id, context_id: context.id, access_level: Binding.full_access())
    assert Access.get_binding(group_id: members.id, context_id: context.id, access_level: Binding.edit_access())
  end

  test "ProjectCreation operation creates activity and notification", ctx do
    {:ok, project} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectCreation.run(ctx.project_attrs)
    end)

    activity = from(a in Activity, where: a.action == "project_created" and a.content["project_id"] == ^project.id) |> Repo.one()

    assert 0 == notifications_count()

    perform_job(activity.id)

    assert fetch_notifications(activity.id)
    assert 2 == notifications_count()
  end
end
