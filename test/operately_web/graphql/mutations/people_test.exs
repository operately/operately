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
        :timezone => "Europe/Berlin",
        :avatarUrl => "/media/3ff2295a-09fa-44a7-8ac7-f7c120c163ba-21e4a757-1196-40a0-bb3f-360e565955aa"
      }
    })

    assert json_response(conn, 200) == %{
      "data" => %{
        "updateProfile" => %{
          "fullName" => "John Doe",
          "title" => "CEO",
          "timezone" => "Europe/Berlin",
          "avatar_url" => "/media/3ff2295a-09fa-44a7-8ac7-f7c120c163ba-21e4a757-1196-40a0-bb3f-360e565955aa",
        }
      }
    }
  end

  defp graphql(conn, query, variables) do
    conn |> post("/api/gql", %{query: query, variables: variables})
  end
end
