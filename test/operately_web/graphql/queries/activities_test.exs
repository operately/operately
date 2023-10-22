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
    activity = activity_fixture(%{author_id: person.id, action: "project_discussion_submitted", content: %{}})

    {:ok, %{company: company, person: person, project: project, activity: activity}}
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
