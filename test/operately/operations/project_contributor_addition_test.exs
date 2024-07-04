defmodule Operately.Operations.ProjectContributorAdditionTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Projects
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    contributor = person_fixture_with_account(%{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: company.company_space_id})

    {:ok, company: company, creator: creator, contributor: contributor, project: project}
  end

  test "ProjectContributorAddition operation creates contributor", ctx do
    Operately.Operations.ProjectContributorAddition.run(ctx.creator, %{
      project_id: ctx.project.id,
      person_id: ctx.contributor.id,
      responsibility: "Developer",
    })

    contributors = Projects.list_project_contributors(ctx.project) |> Enum.map(fn c -> {c.person_id, c.role} end)

    assert 3 == length(contributors)
    assert Enum.member?(contributors, {ctx.contributor.id, :contributor})
  end

  test "ProjectContributorAddition operation creates activity and notification", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectContributorAddition.run(ctx.creator, %{
        project_id: ctx.project.id,
        person_id: ctx.contributor.id,
        responsibility: "Developer",
      })
    end)

    activity = from(a in Activity, where: a.action == "project_contributor_addition" and a.content["project_id"] == ^ctx.project.id) |> Repo.one()

    assert 0 == notifications_count()

    perform_job(activity.id)

    assert fetch_notification(activity.id)
    assert 1 == notifications_count()
  end
end
