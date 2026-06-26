defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateAssigneeTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.UpdateAssignee
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 updates a task assignee" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task: task}} =
             UpdateAssignee.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "assignee_id" => Paths.person_id(ctx.coworker)
             })

    assert task.id == Paths.task_id(ctx.task)

    task = ToolConnHelper.reload(ctx.task, :assigned_people)

    assert Enum.map(task.assigned_people, & &1.id) == [ctx.coworker.id]
  end

  test "call/2 replaces task assignees with assignee_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_company_member(:other_coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task: task}} =
             UpdateAssignee.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "assignee_ids" => [Paths.person_id(ctx.coworker), Paths.person_id(ctx.other_coworker)]
             })

    assert task.id == Paths.task_id(ctx.task)

    task = ToolConnHelper.reload(ctx.task, :assigned_people)

    assert MapSet.new(Enum.map(task.assigned_people, & &1.id)) ==
             MapSet.new([ctx.coworker.id, ctx.other_coworker.id])
  end

  test "call/2 removes one assignee while keeping the others" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_company_member(:other_coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.add_task_assignee(:assignee, :task, :coworker)
      |> Factory.add_task_assignee(:other_assignee, :task, :other_coworker)

    task = ToolConnHelper.reload(ctx.task, :assigned_people)

    assert MapSet.new(Enum.map(task.assigned_people, & &1.id)) ==
             MapSet.new([ctx.coworker.id, ctx.other_coworker.id])

    assert {:ok, %{task: task}} =
             UpdateAssignee.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "assignee_ids" => [Paths.person_id(ctx.coworker)]
             })

    assert task.id == Paths.task_id(ctx.task)
    assert Enum.map(ToolConnHelper.reload(ctx.task, :assigned_people).assigned_people, & &1.id) == [ctx.coworker.id]
  end

  test "call/2 clears the task assignees when assignee fields are omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.add_task_assignee(:assignee, :task, :coworker)

    task = ToolConnHelper.reload(ctx.task, :assigned_people)
    assert Enum.map(task.assigned_people, & &1.id) == [ctx.coworker.id]

    assert {:ok, %{task: task}} =
             UpdateAssignee.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task)
             })

    assert task.id == Paths.task_id(ctx.task)
    assert ToolConnHelper.reload(ctx.task, :assigned_people).assigned_people == []
  end

  test "call/2 clears the task assignees when assignee_ids is empty" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)
      |> Factory.add_task_assignee(:assignee, :task, :coworker)

    assert {:ok, %{task: task}} =
             UpdateAssignee.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "assignee_ids" => []
             })

    assert task.id == Paths.task_id(ctx.task)
    assert ToolConnHelper.reload(ctx.task, :assigned_people).assigned_people == []
  end

  test "returns invalid_arguments when assignee_id and assignee_ids are both provided" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:error, :invalid_arguments} =
             UpdateAssignee.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "assignee_id" => Paths.person_id(ctx.coworker),
               "assignee_ids" => [Paths.person_id(ctx.coworker)]
             })
  end
end
