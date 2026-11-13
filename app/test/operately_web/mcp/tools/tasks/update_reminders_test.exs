defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateRemindersTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.UpdateReminders
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space) |> Factory.add_project_milestone(:milestone, :project) |> Factory.add_project_task(:task, :milestone)
  end

  test "applies the API operation with encoded identifiers", ctx do
    assert {:ok, %{task: _task}} =
             UpdateReminders.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "reminders" => [%{"type" => "before_due", "days" => 2}, %{"type" => "due_day"}, %{"type" => "on_date", "date" => "2027-01-20"}]
             })

    assert Enum.map(Repo.reload!(ctx.task).reminders, & &1.type) == [:before_due, :due_day, :on_date]
  end

  test "rejects invalid reminder dates and clears reminders explicitly", ctx do
    conn = ToolConnHelper.conn(ctx)
    assert {:error, :invalid_arguments} = UpdateReminders.call(conn, %{"task_id" => Paths.task_id(ctx.task), "reminders" => [%{"type" => "on_date", "date" => "2027-02-30"}]})
    assert {:ok, %{task: _}} = UpdateReminders.call(conn, %{"task_id" => Paths.task_id(ctx.task), "reminders" => []})
    assert Repo.reload!(ctx.task).reminders == []
  end

  test "rejects malformed identifiers", ctx do
    arguments =
      %{"task_id" => Paths.task_id(ctx.task), "reminders" => [%{"type" => "before_due", "days" => 2}, %{"type" => "due_day"}, %{"type" => "on_date", "date" => "2027-01-20"}]}
      |> Map.put("task_id", "invalid-%%")

    assert {:error, :invalid_arguments} = UpdateReminders.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "rejects a resource in another company", ctx do
    other = %{} |> Factory.setup()

    assert {:error, :not_found} =
             UpdateReminders.call(ToolConnHelper.conn(other), %{
               "task_id" => Paths.task_id(ctx.task),
               "reminders" => [%{"type" => "before_due", "days" => 2}, %{"type" => "due_day"}, %{"type" => "on_date", "date" => "2027-01-20"}]
             })
  end
end
