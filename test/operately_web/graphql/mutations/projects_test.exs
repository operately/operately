defmodule MyAppWeb.GraphQL.Mutations.ProjectsTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.CompaniesFixtures

  setup do
    company = company_fixture()
    creator = person_fixture(%{company_id: company.id})
    group = group_fixture(creator, %{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: group.id})

    {:ok, %{company: company, creator: creator, project: project}}
  end

  @update_project_milestone """
  mutation updateProjectMilestone($milestoneId: ID!, $title: String!, $deadlineAt: Date) {
    updateProjectMilestone(milestoneId: $milestoneId, title: $title, deadlineAt: $deadlineAt) {
      id
      deadlineAt
    }
  }
  """

  test "mutation: update_project_milestone", ctx do
    milestone = milestone_fixture(ctx.creator, %{
      project_id: ctx.project.id, 
      title: "Website Launched"
    })

    conn = graphql(ctx.conn, @update_project_milestone, %{
      "milestoneId" => milestone.id,
      "title" => "Website Launched for all customers",
      "deadlineAt" => "2018-01-01"
    })

    assert json_response(conn, 200)
  end

  @set_project_start_date """
  mutation setProjectStartDate($projectId: ID!, $startDate: Date!) {
    setProjectStartDate(projectId: $projectId, startDate: $startDate) {
      id
      startedAt
    }
  }
  """

  test "mutation: set_project_start_date", ctx do
    conn = graphql(ctx.conn, @set_project_start_date, %{
      "projectId" => ctx.project.id,
      "startDate" => "2018-01-01"
    })

    assert json_response(conn, 200)
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
