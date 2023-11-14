defmodule OperatelyWeb.GraphQL.Queries.PeopleText do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  setup do
    company = company_fixture(%{name: "Acme"})
    person = person_fixture(%{full_name: "Bob Smith", company_id: company.id})
    group = group_fixture(person, %{name: "Developers", company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: group.id})

    {:ok, %{company: company, person: person, project: project}}
  end

  @home_dashboard_query """
    query {
      homeDashboard {
        panels {
          index
          type
        }
      }
    }
  """

  test "query: homeDashboard", ctx do
    conn = graphql(ctx.conn, @home_dashboard_query, %{})

    assert json_response(conn, 200) == %{ 
      "data" => %{
        "homeDashboard" => %{
          "panels" => [
            %{
              "index" => 0,
              "type" => "account",
            },
            %{
              "index" => 1,
              "type" => "my-assignments",
            }
          ]
        }
      }
    }
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
