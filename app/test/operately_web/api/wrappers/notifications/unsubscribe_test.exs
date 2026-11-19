defmodule OperatelyWeb.Api.Wrappers.Notifications.UnsubscribeTest do
  use OperatelyWeb.TurboCase

  alias OperatelyWeb.Api.Wrappers.Notifications.Unsubscribe, as: Api
  alias OperatelyWeb.Api.Notifications.IsSubscribed

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:member)
  end

  test "changes only the current person's subscription", ctx do
    conn = Plug.Conn.assign(ctx.conn, :current_person, ctx.creator)
    member_conn = Plug.Conn.assign(ctx.conn, :current_person, ctx.member)
    inputs = %{resource_id: ctx.project.id, resource_type: :project}
    subscription_inputs = %{subscription_list_id: ctx.project.subscription_list_id, type: :project}

    assert {:ok, %{}} = OperatelyWeb.Api.Notifications.Subscribe.call(member_conn, subscription_inputs)
    assert {:ok, %{}} = OperatelyWeb.Api.Notifications.Subscribe.call(conn, subscription_inputs)

    assert {:ok, %{}} = Api.call(conn, inputs)
    assert {:ok, %{subscribed: false}} = IsSubscribed.call(conn, inputs)
    assert {:ok, %{subscribed: true}} = IsSubscribed.call(member_conn, inputs)
  end

  test "requires authentication and access to the resource", ctx do
    inputs = %{resource_id: ctx.project.id, resource_type: :project}
    assert {:error, :not_found} = Api.call(ctx.conn, inputs)
    other = Factory.setup(%{})
    assert {:error, :not_found} = Api.call(Plug.Conn.assign(ctx.conn, :current_person, other.creator), inputs)
  end
end
