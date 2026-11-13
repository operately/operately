defmodule OperatelyWeb.Mcp.Tools.People.UpdatePersonTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.People.UpdatePerson, as: Tool
  alias OperatelyWeb.Paths

  test "maps partial profile changes and preserves omitted preferences" do
    ctx = Factory.setup(%{})
    conn = ToolConnHelper.conn(ctx)
    args = %{"person_id" => Paths.person_id(ctx.creator), "title" => "Designer", "description" => "About me", "notify_on_mention" => false}
    assert {:ok, %{person: person}} = Tool.call(conn, args)
    assert person.title == "Designer"

    assert {:ok, _} = Tool.call(conn, %{"person_id" => Paths.person_id(ctx.creator), "manager_id" => nil, "description" => nil})
    assert {:ok, %{me: me}} = OperatelyWeb.Mcp.Tools.People.GetMe.call(ToolConnHelper.conn_as(ctx, Repo.reload!(ctx.creator)), %{})

    refute me.notify_on_mention
    assert me.description == nil
    assert me.title == "Designer"

    other = Factory.setup(%{})
    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(other), args)
    assert {:error, :invalid_arguments} = Tool.call(conn, %{"person_id" => "definitely-not-a-valid-operately-id-%%%"})
  end
end
