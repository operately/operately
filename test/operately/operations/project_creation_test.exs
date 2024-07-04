defmodule Operately.Operations.ProjectCreationTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()

    creator = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})

    group = group_fixture(creator)

    {:ok, company: company, creator: creator, reviewer: reviewer, champion: champion, group: group}
  end

  test "ProjectCreation operation creates project", ctx do
    attrs = %Operately.Operations.ProjectCreation{
      name: "my project",
      champion_id: ctx.champion.id,
      reviewer_id: ctx.reviewer.id,
      creator_is_contributor: "yes",
      creator_role: "developer",
      visibility: "everyone",
      creator_id: ctx.creator.id,
      company_id: ctx.company.id,
      group_id: ctx.group.id,
    }

    {:ok, project} = Operately.Operations.ProjectCreation.run(attrs)

    contributors = Projects.list_project_contributors(project)

    assert 3 == length(contributors)

    contributors = Enum.map(contributors, fn contributor -> {contributor.person_id, contributor.role} end)

    assert Enum.member?(contributors, {ctx.creator.id, :contributor})
    assert Enum.member?(contributors, {ctx.reviewer.id, :reviewer})
    assert Enum.member?(contributors, {ctx.champion.id, :champion})
  end

  test "ProjectCreation operation creates activity and notification", ctx do
    attrs = %Operately.Operations.ProjectCreation{
      name: "my project",
      champion_id: ctx.champion.id,
      reviewer_id: ctx.reviewer.id,
      creator_is_contributor: "yes",
      creator_role: "developer",
      visibility: "everyone",
      creator_id: ctx.creator.id,
      company_id: ctx.company.id,
      group_id: ctx.group.id,
    }

    {:ok, project} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectCreation.run(attrs)
    end)

    activity = from(a in Activity, where: a.action == "project_created" and a.content["project_id"] == ^project.id) |> Repo.one()

    assert 0 == notifications_count()

    perform_job(activity.id)

    assert fetch_notifications(activity.id)
    assert 2 == notifications_count()
  end
end
