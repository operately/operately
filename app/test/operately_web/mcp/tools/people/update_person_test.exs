defmodule OperatelyWeb.Mcp.Tools.People.UpdatePersonTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.People.UpdatePerson, as: Tool
  alias OperatelyWeb.Paths

  test "advertises the allowed notification preference values" do
    properties = Tool.definition().input_schema["properties"]
    assert properties["email_window_minutes"]["enum"] == Operately.People.Preferences.Notifications.email_window_minutes()
    assert properties["daily_summary_delivery_time"]["enum"] == Operately.People.Preferences.Notifications.daily_summary_delivery_times()
  end

  test "saves allowed notification preferences and rejects unsupported values" do
    ctx = Factory.setup(%{})
    arguments = %{"person_id" => Paths.person_id(ctx.creator), "email_window_minutes" => 30, "daily_summary_delivery_time" => "09:00"}

    assert {:ok, _} = Tool.call(ToolConnHelper.conn(ctx), arguments)
    person = Repo.reload!(ctx.creator)
    assert Operately.People.Person.email_window_minutes(person) == 30
    assert Operately.People.Person.daily_summary_delivery_time(person) == "09:00"

    for {field, value} <- [{"email_window_minutes", 20}, {"daily_summary_delivery_time", "09:30"}] do
      assert {:error, :invalid_arguments} = Tool.call(ToolConnHelper.conn_as(ctx, person), Map.put(arguments, field, value))
    end
  end

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
