defmodule MyAppWeb.SchemaTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  alias Operately.{CompaniesFixtures, PeopleFixtures, ProjectsFixtures}

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

  test "query: projectContributorCandidates", %{conn: conn} do
    company = CompaniesFixtures.company_fixture(%{name: "Acme"})

    person = PeopleFixtures.person_fixture(%{
      full_name: "Bob Smith",
      title: "Developer",
      company_id: company.id
    })

    project = ProjectsFixtures.project_fixture(%{
      name: "Example"
    })

    conn = graphql(conn, @project_contributor_candidates_query, %{
      "projectId" => project.id,
      "query" => "bob"
    })

    assert json_response(conn, 200) == %{ 
      "data" => %{
        "projectContributorCandidates" => [
          %{ 
            "avatarUrl" => person.avatar_url,
            "fullName" => person.full_name,
            "id" => person.id,
            "title" => person.title
          }
        ]
      }
    }
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
