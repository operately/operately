defmodule MyAppWeb.GraphQL.Queries.ActivitiesTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.ActivitiesFixtures

  setup do
    company = company_fixture(%{name: "Acme"})
    person = person_fixture(%{full_name: "Bob Smith", company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: person.id})
    activity = activity_fixture(%{
      action_type: "create", 
      resource_type: "project", 
      resource_id: project.id, 
      person_id: person.id,
      scope_type: "project",
      scope_id: project.id,
      event_data: %{
        type: "project_create",
        champion_id: person.id
      }
    })

    {:ok, %{company: company, person: person, project: project, activity: activity}}
  end

  @list_activities_query """
    query($scopeType: String!, $scopeId: ID!) {
      activities(scopeType: $scopeType, scopeId: $scopeId) {
        id
        insertedAt

        actionType
        resourceType

        person {
          id
          fullName
        }

        resource {
          ... on Project {
            id
            name
          }
        }
      }
    }
  """

  test "query: list activities", ctx do
    conn = graphql(ctx.conn, @list_activities_query, %{
      "scopeType" => "project",
      "scopeId" => ctx.project.id
    })

    assert json_response(conn, 200)
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
