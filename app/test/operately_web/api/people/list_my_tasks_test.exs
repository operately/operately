defmodule OperatelyWeb.Api.People.ListMyTasksTest do
  use OperatelyWeb.TurboCase

  alias Operately.Tasks
  alias OperatelyWeb.Paths

  describe "security" do
    test "requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:people, :list_my_tasks], %{})
    end
  end

  describe "list_my_tasks" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.log_in_person(:creator)
    end

    test "returns open tasks assigned to the current person", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone, name: "Ship the launch")
        |> Factory.add_task_assignee(:assignee, :task, :creator)
        |> Factory.add_company_member(:coworker)
        |> Factory.add_project_task(:other_task, :milestone, name: "Coworker task")
        |> Factory.add_task_assignee(:other_assignee, :other_task, :coworker)

      assert {200, %{tasks: tasks}} = query(ctx.conn, [:people, :list_my_tasks], %{})

      assert Enum.map(tasks, & &1.id) == [Paths.task_id(ctx.task)]
      assert hd(tasks).name == "Ship the launch"
    end

    test "returns an empty list when the person has no open tasks", ctx do
      assert {200, %{tasks: []}} = query(ctx.conn, [:people, :list_my_tasks], %{})
    end

    test "omits closed tasks", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone, name: "Done task")
        |> Factory.add_task_assignee(:assignee, :task, :creator)

      close_task(ctx.task)

      assert {200, %{tasks: tasks}} = query(ctx.conn, [:people, :list_my_tasks], %{})
      refute Enum.any?(tasks, &(&1.id == Paths.task_id(ctx.task)))
    end

    test "omits tasks on paused projects", ctx do
      ctx =
        ctx
        |> Factory.add_project_task(:task, :milestone, name: "Paused task")
        |> Factory.add_task_assignee(:assignee, :task, :creator)

      {:ok, _} = Operately.Projects.update_project(ctx.project, %{status: "paused"})

      assert {200, %{tasks: []}} = query(ctx.conn, [:people, :list_my_tasks], %{})
    end
  end

  defp close_task(task) do
    {:ok, _} =
      Tasks.update_task(task, %{
        task_status: %{id: Ecto.UUID.generate(), label: "Done", color: :green, index: 0, value: "done", closed: true},
        closed_at: NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
      })
  end
end
