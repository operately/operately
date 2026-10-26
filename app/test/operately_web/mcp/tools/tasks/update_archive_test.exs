defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateArchiveTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.UpdateArchive
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    %{}
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
  end

  test "decodes the task ID and archives and restores through the API", ctx do
    status = Enum.find(ctx.project.task_statuses, & &1.closed)
    {:ok, task} = Operately.Tasks.update_task(ctx.task, Operately.Tasks.Task.status_change_attrs(ctx.task, status))
    args = %{"task_id" => Paths.task_id(task), "archived" => true}
    assert {:ok, %{task: archived}} = UpdateArchive.call(ToolConnHelper.conn(ctx), args)
    assert archived.archived_at
    assert {:ok, %{task: restored}} = UpdateArchive.call(ToolConnHelper.conn(ctx), %{args | "archived" => false})
    assert is_nil(restored.archived_at)
  end

  test "rejects malformed IDs and non-boolean archive values", ctx do
    assert {:error, :invalid_arguments} = UpdateArchive.call(ToolConnHelper.conn(ctx), %{"task_id" => "%%%", "archived" => true})
    assert {:error, :invalid_arguments} = UpdateArchive.call(ToolConnHelper.conn(ctx), %{"task_id" => Paths.task_id(ctx.task), "archived" => "true"})
  end

  test "does not expose tasks from another company", ctx do
    other = Factory.setup(%{})
    assert {:error, :not_found} = UpdateArchive.call(ToolConnHelper.conn(other), %{"task_id" => Paths.task_id(ctx.task), "archived" => true})
  end
end
