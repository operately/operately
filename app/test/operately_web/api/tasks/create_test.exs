defmodule OperatelyWeb.Api.Tasks.CreateTest do
  use OperatelyWeb.TurboCase

  test "publishes one project update for web and external writes", ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_company_member(:member)
      |> Factory.add_api_token(:token, :creator, read_only: false)
      |> Factory.log_in_person(:creator)

    topic = "api:project_updated:#{ctx.project.id}"
    OperatelyWeb.Endpoint.subscribe(topic)
    inputs = %{type: "project", id: Paths.project_id(ctx.project), name: "New task", due_date: nil}

    assert {200, _} = mutation(ctx.conn, [:tasks, :create], inputs)
    assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event", payload: %{}}
    refute_receive %Phoenix.Socket.Broadcast{topic: ^topic}
    assert {200, _} = external_mutation(Phoenix.ConnTest.build_conn(), ctx.token, "tasks/create", inputs)
    assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event", payload: %{}}
    refute_receive %Phoenix.Socket.Broadcast{topic: ^topic}
  end
end
