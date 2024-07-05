defmodule Operately.Operations.ProjectGoalDisconnectionTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.GoalsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Repo
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    contributor = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator)
    goal = goal_fixture(creator, %{space_id: group.id, targets: []})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: group.id, goal_id: goal.id})

    Oban.Testing.with_testing_mode(:manual, fn ->
      contributor_fixture(creator, %{project_id: project.id, person_id: contributor.id})
    end)

    {:ok, creator: creator, contributor: contributor, project: project, goal: goal}
  end

  test "ProjectGoalDisconnection operation updates project.goal_id to nil", ctx do
    assert ctx.project.goal_id == ctx.goal.id

    Operately.Operations.ProjectGoalDisconnection.run(ctx.creator, ctx.project, ctx.goal)

    project = Repo.reload(ctx.project)

    assert project.goal_id == nil
  end

  test "ProjectGoalDisconnection operation creates activity and notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectGoalDisconnection.run(ctx.creator, ctx.project, ctx.goal)
    end)

    activity = from(a in Activity, where: a.action == "project_goal_disconnection" and a.content["goal_id"] == ^ctx.goal.id) |> Repo.one()

    assert 0 == notifications_count()

    perform_job(activity.id)

    assert 1 == notifications_count()
    assert nil != fetch_notification(activity.id)
  end
end
