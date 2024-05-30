defmodule OperatelyWeb.Api.Queries.GetActivitiesTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  setup do
    company = company_fixture()
    champion = person_fixture(%{company_id: company.id})
    reviewer = person_fixture(%{company_id: company.id})
    space = group_fixture(champion)
    project = project_fixture(%{
      company_id: company.id,
      creator_id: champion.id,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      group_id: space.id
    })

    {:ok, %{company: company, champion: champion, reviewer: reviewer, space: space, project: project}}
  end

  test "loading all activities in a company", ctx do
    {:ok, activities} = OperatelyWeb.Api.Queries.GetActivities.call(nil, %{
      scope_type: "company",
      scope_id: ctx.company.id,
      actions: []
    })

    assert length(activities) == 1
    assert Enum.at(activities, 0).action == "project_created"
    assert Enum.at(activities, 0).content.project_id == ctx.project.id
    assert Enum.at(activities, 0).content.project.name == ctx.project.name
    assert Enum.at(activities, 0).content.company.name == ctx.company.name
  end

end
