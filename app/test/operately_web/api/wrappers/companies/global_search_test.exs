defmodule OperatelyWeb.Api.Wrappers.Companies.GlobalSearchTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Searchable Space")
    |> Factory.add_project(:project, :space, name: "Searchable Project")
    |> Factory.add_messages_board(:board, :space)
    |> Factory.add_message(:discussion, :board, title: "Searchable Discussion")
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, name: "Searchable Document")
    |> Factory.add_api_token(:api_token, :creator, read_only: true)
  end

  test "is not registered on the internal API", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    assert {404, "Query not found"} =
             query(ctx.conn, [:companies, :global_search], query: "Searchable")
  end

  test "requires an API token", ctx do
    assert {401, "Unauthorized"} =
             external_query(ctx.conn, nil, "companies/global_search", query: "Searchable")
  end

  test "returns the quick search response unchanged", ctx do
    assert {200, quick_search_response} =
             external_query(ctx.conn, ctx.api_token, "companies/quick_search", query: "Searchable")

    assert {200, global_search_response} =
             external_query(ctx.conn, ctx.api_token, "companies/global_search", query: "Searchable")

    assert global_search_response == quick_search_response

    assert Map.keys(global_search_response) |> Enum.sort() ==
             ~w(discussions documents files folders goals links milestones people projects spaces tasks)a

    assert Enum.map(global_search_response.discussions, & &1.id) == [Paths.message_id(ctx.discussion)]
    assert Enum.map(global_search_response.documents, & &1.id) == [Paths.document_id(ctx.document)]
  end
end
