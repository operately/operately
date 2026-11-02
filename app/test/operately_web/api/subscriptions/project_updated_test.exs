defmodule OperatelyWeb.Api.Subscriptions.ProjectUpdatedTest do
  use OperatelyWeb.ChannelCase

  alias Operately.Support.Factory
  alias OperatelyWeb.Api.Subscriptions.ProjectUpdated
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:viewer)
  end

  test "joins the canonical project topic for a viewer", ctx do
    socket = socket(OperatelyWeb.ApiSocket, "test", %{person: ctx.viewer, company: ctx.company})
    assert {:ok, ^socket, [id]} = ProjectUpdated.join("project_updated", %{"projectId" => Paths.project_id(ctx.project)}, socket)
    assert id == ctx.project.id
  end

  test "rejects missing, malformed, nonexistent and inaccessible projects", ctx do
    ctx = Factory.add_project(ctx, :private, :space, company_access_level: 0, space_access_level: 0)
    socket = socket(OperatelyWeb.ApiSocket, "test", %{person: ctx.viewer, company: ctx.company})

    for id <- [nil, 123, [], "invalid", Ecto.UUID.generate(), Paths.project_id(ctx.private)] do
      assert {:error, _} = ProjectUpdated.join("project_updated", %{"projectId" => id}, socket)
    end
  end

  test "rejects another company and missing membership", ctx do
    socket = socket(OperatelyWeb.ApiSocket, "test", %{person: ctx.creator, company: %{id: Ecto.UUID.generate()}})
    assert {:error, _} = ProjectUpdated.join("project_updated", %{"projectId" => ctx.project.id}, socket)
    assert {:error, _} = ProjectUpdated.join("project_updated", %{"projectId" => ctx.project.id}, socket(OperatelyWeb.ApiSocket))
  end

  test "broadcasts empty events once per project and preserves errors", ctx do
    topic = "api:project_updated:#{ctx.project.id}"
    OperatelyWeb.Endpoint.subscribe(topic)
    assert :ok = ProjectUpdated.broadcast([nil, ctx.project.id, ctx.project.id])
    assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event", payload: %{}}
    refute_receive %Phoenix.Socket.Broadcast{topic: ^topic}

    error = {:error, :project, :invalid, %{}}
    assert ^error = ProjectUpdated.broadcast_result(error, [ctx.project.id])
    refute_receive %Phoenix.Socket.Broadcast{topic: ^topic}
  end

  test "channel returns a rejected subscription without crashing", ctx do
    socket = socket(OperatelyWeb.ApiSocket, "test", %{account: Operately.Repo.preload(ctx.viewer, :account).account})

    assert {:error, _} =
             subscribe_and_join(socket, OperatelyWeb.ApiSocket.Channel, "api:project_updated", %{
               "x-company-id" => Paths.company_id(ctx.company),
               "projectId" => "invalid"
             })
  end

  test "nested writes do not broadcast before the outer transaction commits", ctx do
    topic = "api:project_updated:#{ctx.project.id}"
    OperatelyWeb.Endpoint.subscribe(topic)

    assert {:error, :rollback} =
             Operately.Repo.transaction(fn ->
               ProjectUpdated.broadcast_result({:ok, :updated}, ctx.project.id)
               Operately.Repo.rollback(:rollback)
             end)

    refute_receive %Phoenix.Socket.Broadcast{topic: ^topic}
  end
end
