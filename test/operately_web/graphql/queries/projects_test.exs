defmodule MyAppWeb.GraphQL.Queries.ProjectsTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures

  setup do
    company = company_fixture(%{name: "Acme"})
    person = person_fixture(%{full_name: "Bob Smith", company_id: company.id})
    group = group_fixture(person, %{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: group.id})

    {:ok, %{company: company, person: person, project: project}}
  end

  @project_contributor_candidates_query """
  query projectContributorCandidates($projectId: ID!, $query: String!) {
    projectContributorCandidates(projectId: $projectId, query: $query) {
      id
      fullName
      title
      avatarUrl
    }
  }
  """

  test "query: projectContributorCandidates", ctx do
    remove_all_people_from_project(ctx.project)

    conn = graphql(ctx.conn, @project_contributor_candidates_query, %{
      "projectId" => ctx.project.id,
      "query" => "bob"
    })

    assert json_response(conn, 200) == %{
      "data" => %{
        "projectContributorCandidates" => [
          %{
            "avatarUrl" => ctx.person.avatar_url,
            "fullName" => ctx.person.full_name,
            "id" => ctx.person.id,
            "title" => ctx.person.title
          }
        ]
      }
    }
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end

  defp remove_all_people_from_project(project) do
    Enum.each(Operately.Projects.list_project_contributors(project), fn c ->
      Operately.Projects.delete_contributor(c)
    end)
  end
end
