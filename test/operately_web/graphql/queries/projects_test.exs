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
    project = project_fixture(%{company_id: company.id, creator_id: person.id})

    {:ok, %{company: company, person: person, project: project}}
  end

  @projects_query """
  query projects($groupId: ID, $groupMemberRoles: [String!], $limitContributorsToGroupMembers: Boolean, $objectiveId: ID) {
    projects(groupId: $groupId, groupMemberRoles: $groupMemberRoles, limitContributorsToGroupMembers: $limitContributorsToGroupMembers, objectiveId: $objectiveId) {
      id
      contributors {
        person {
          id
        }
      }
    }
  }
  """

  describe "query: projects" do
    setup ctx do
      group = group_fixture(%{company_id: ctx.company.id})
      person1 = person_fixture(%{full_name: "Bob Smith", company_id: ctx.company.id})
      person2 = person_fixture(%{full_name: "Jane Doe", company_id: ctx.company.id})

      {:ok, _} = Operately.Projects.create_contributor(%{
        project_id: ctx.project.id,
        person_id: person1.id,
        role: "contributor",
      })

      {:ok, _} = Operately.Projects.create_contributor(%{
        project_id: ctx.project.id,
        person_id: person2.id,
        role: "contributor",
      })

      {:ok, _} = Operately.Groups.add_member(group, person1.id)
      
      {:ok, %{group: group, person1: person1, person2: person2}}
    end

    test "with contributors limited to group members", ctx do
      conn = graphql(ctx.conn, @projects_query, %{
        "filters" => %{
          "groupId" => ctx.group.id,
          "groupMemberRoles" => ["contributor"],
          "limitContributorsToGroupMembers" => true,
        }
      })

      assert json_response(conn, 200) == %{
        "data" => %{
          "projects" => [
            %{
              "contributors" => [
                %{"person" => %{"id" => ctx.person1.id}}
              ],
              "id" => ctx.project.id
            }
          ]
        }
      }
    end

    test "with all contributors", ctx do
      conn = graphql(ctx.conn, @projects_query, %{
        "filters" => %{
          "groupId" => ctx.group.id,
          "groupMemberRoles" => ["contributor"],
          "limitContributorsToGroupMembers" => false,
        }
      })

      assert json_response(conn, 200) == %{
        "data" => %{
          "projects" => [
            %{
              "contributors" => [
                %{"person" => %{"id" => ctx.person1.id}},
                %{"person" => %{"id" => ctx.person2.id}}
              ],
              "id" => ctx.project.id
            }
          ]
        }
      }
    end
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
end
