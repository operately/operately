defmodule OperatelyWeb.Mcp.Tools.Tasks.CreateTest do
  use Operately.DataCase, async: true

  alias Operately.Tasks.Task
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.Create
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates project and space tasks" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:coworker)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    assert {:ok, %{task: project_task}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "milestone_id" => Paths.milestone_id(ctx.milestone),
               "name" => "Project MCP Task",
               "assignee_id" => Paths.person_id(ctx.coworker),
               "description" => "Initial task description",
               "due_date" => "2026-08-20"
             })

    assert {:ok, %{task: space_task}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "Space MCP Task"
             })

    project_task = Operately.Repo.get!(Task, ToolConnHelper.decode_id!(project_task.id))
    space_task = Operately.Repo.get!(Task, ToolConnHelper.decode_id!(space_task.id))

    assert project_task.project_id == ctx.project.id
    assert project_task.milestone_id == ctx.milestone.id
    assert project_task.due_date.date == ~D[2026-08-20]
    assert ToolConnHelper.rich_text_to_string(project_task.description) == "Initial task description"

    assert space_task.space_id == ctx.space.id
    assert is_nil(space_task.project_id)
  end

  test "call/2 creates a space task with only required params" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)

    assert {:ok, %{task: task}} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Space Task"
             })

    task =
      Task
      |> Operately.Repo.get!(ToolConnHelper.decode_id!(task.id))
      |> Operately.Repo.preload(:assigned_people)

    assert task.name == "MCP Space Task"
    assert task.space_id == ctx.space.id
    assert is_nil(task.project_id)
    assert is_nil(task.milestone_id)
    assert is_nil(task.due_date)
    assert task.description == %{}
    assert task.assigned_people == []
  end

  test "returns invalid_arguments for missing, conflicting, and invalid parent inputs" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)

    assert {:error, :invalid_arguments} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "name" => "Missing parent"
             })

    assert {:error, :invalid_arguments} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "space_id" => Paths.space_id(ctx.space),
               "name" => "Conflicting parent"
             })

    assert {:error, :invalid_arguments} =
             Create.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "milestone_id" => Paths.milestone_id(ctx.milestone),
               "name" => "Invalid milestone"
             })
  end
end
