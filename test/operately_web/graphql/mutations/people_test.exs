defmodule OperatelyWeb.GraphQL.Mutations.PeopleTest do
  use OperatelyWeb.ConnCase

  setup :register_and_log_in_account

  @update_profile """
  mutation updateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      fullName
      title
      timezone
      avatar_url
    }
  }
  """

  test "mutation: updateProfile", ctx do
    conn = graphql(ctx.conn, @update_profile, %{
      :input => %{
        :fullName => "John Doe",
        :title => "CEO",
        :timezone => "Europe/Berlin"
      }
    })

    assert json_response(conn, 200) == %{
      "data" => %{
        "updateProfile" => %{
          "fullName" => "John Doe",
          "title" => "CEO",
          "timezone" => "Europe/Berlin",
          "avatar_url" => "/blobs/c04b084b-e13b-4b07-b264-6173b5ec534c",
        }
      }
    }
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
