defmodule OperatelyWeb.Mcp.Tools.People.ListAssignmentsTest do
  # The assignments loader queries from worker processes. Shared sandbox mode
  # is required so those workers can see this test's transaction.
  use Operately.DataCase, async: false

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.People.ListAssignments
  alias OperatelyWeb.Paths

  test "returns open tasks assigned to the authenticated person" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone, name: "Ship the launch")
      |> Factory.add_task_assignee(:assignee, :task, :creator)
      |> Factory.add_company_member(:coworker)
      |> Factory.add_project_task(:other_task, :milestone, name: "Coworker task")
      |> Factory.add_task_assignee(:other_assignee, :other_task, :coworker)

    assert {:ok, %{due_soon: due_soon, needs_review: needs_review, upcoming: upcoming}} =
             ListAssignments.call(ToolConnHelper.conn(ctx), %{})

    assignments = flatten(due_soon ++ needs_review ++ upcoming)
    task = Enum.find(assignments, &(&1.type == "project_task" and &1.name == "Ship the launch"))

    assert task.resource_id == Paths.task_id(ctx.task)
    assert task.role == "owner"
    refute Enum.any?(assignments, &(&1.resource_id == Paths.task_id(ctx.other_task)))
  end

  test "returns empty groups when the person has no assignments" do
    ctx = Factory.setup(%{})

    assert {:ok, %{due_soon: [], needs_review: [], upcoming: []}} = ListAssignments.call(ToolConnHelper.conn(ctx), %{})
  end

  defp flatten(groups), do: Enum.flat_map(groups, & &1.assignments)
end
