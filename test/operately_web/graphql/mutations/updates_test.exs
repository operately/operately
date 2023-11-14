defmodule MyAppWeb.GraphQL.Mutations.UpdatesTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.CompaniesFixtures
  import Operately.UpdatesFixtures

  @create_comment_query """
    mutation createComment($input: CreateCommentInput!) {
      createComment(input: $input) {
        id
        content
        insertedAt
        updatedAt
        author {
          id
          name
        }
      }
    }
  """

  @acknowledge_query """
    mutation acknowledge($id: ID!) {
      acknowledge(id: $id) {
        id
      }
    }
  """

  setup do
    company = company_fixture()
    creator = person_fixture(%{company_id: company.id})
    group = group_fixture(creator, %{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: group.id})

    update = update_fixture(%{
      author_id: creator.id,
      updatable_id: project.id,
      updatable_type: :project,
    })

    {:ok, %{company: company, creator: creator, project: project, update: update}}
  end

  test "mutation: create_comment", ctx do
    conn = graphql(ctx.conn, @create_comment_query, %{
      input: %{
        content: "This is a comment",
        updateId: ctx.update.id
      }
    })

    assert json_response(conn, 200)
  end

  test "mutation: acknowledge", ctx do
    conn = graphql(ctx.conn, @acknowledge_query, %{
      id: ctx.update.id
    })

    assert json_response(conn, 200)
  end
      
  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
