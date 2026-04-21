defmodule Operately.CompanyTransfers.Import.OrderingStateRewriterTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Import.{OrderingStateRewriter, TranslationPlan}
  alias Operately.Projects.Milestone
  alias Operately.Projects.OrderingState, as: ProjectOrderingState
  alias Operately.ShortUuid
  alias Operately.Tasks.OrderingState, as: TaskOrderingState
  alias Operately.Tasks.Task
  alias OperatelyWeb.Paths
  alias OperatelyWeb.Api.Helpers

  test "rewrites milestone ordering state ids" do
    source_milestone_id = Ecto.UUID.generate()
    destination_milestone_id = Ecto.UUID.generate()

    row = %{
      "milestones_ordering_state" => [
        encoded_id("Roadmap", source_milestone_id)
      ]
    }

    plan = translation_plan(%{"project_milestones" => %{source_milestone_id => destination_milestone_id}})

    assert {:ok, rewritten} = OrderingStateRewriter.rewrite_row_fields(row, "projects", plan)

    assert rewritten["milestones_ordering_state"] == [
             encoded_id("Roadmap", destination_milestone_id)
           ]
  end

  test "rewrites task kanban state ids" do
    source_task_id = Ecto.UUID.generate()
    destination_task_id = Ecto.UUID.generate()

    row = %{
      "tasks_kanban_state" => %{
        "in_progress" => [encoded_id("Write tests", source_task_id)],
        "done" => []
      }
    }

    plan = translation_plan(%{"tasks" => %{source_task_id => destination_task_id}})

    assert {:ok, rewritten} = OrderingStateRewriter.rewrite_row_fields(row, "project_milestones", plan)

    assert rewritten["tasks_kanban_state"] == %{
             "in_progress" => [encoded_id("Write tests", destination_task_id)],
             "done" => []
           }
  end

  test "drops stale ids that cannot be translated" do
    source_task_id = Ecto.UUID.generate()
    stale_task_id = Ecto.UUID.generate()
    destination_task_id = Ecto.UUID.generate()

    row = %{
      "tasks_ordering_state" => [
        encoded_id("Keep", source_task_id),
        encoded_id("Drop", stale_task_id)
      ]
    }

    plan = translation_plan(%{"tasks" => %{source_task_id => destination_task_id}})

    assert {:ok, rewritten} = OrderingStateRewriter.rewrite_row_fields(row, "project_milestones", plan)

    assert rewritten["tasks_ordering_state"] == [
             encoded_id("Keep", destination_task_id)
           ]
  end

  test "preserves realistic milestone ordering built through project ordering operations" do
    source_one = milestone("Alpha Roadmap")
    source_two = milestone("Beta Release")
    source_three = milestone("Q2 Planning")
    source_four = milestone("Beta Release")

    source_state =
      ProjectOrderingState.initialize()
      |> ProjectOrderingState.add_milestone(source_one)
      |> ProjectOrderingState.add_milestone(source_two)
      |> ProjectOrderingState.add_milestone(source_three)
      |> ProjectOrderingState.add_milestone(source_four, 1)
      |> ProjectOrderingState.add_milestone(source_two, 2)

    destination_one = destination_milestone(source_one)
    destination_two = destination_milestone(source_two)
    destination_three = destination_milestone(source_three)
    destination_four = destination_milestone(source_four)

    plan =
      translation_plan(%{
        "project_milestones" => %{
          source_one.id => destination_one.id,
          source_two.id => destination_two.id,
          source_three.id => destination_three.id,
          source_four.id => destination_four.id
        }
      })

    row = %{"milestones_ordering_state" => source_state}

    assert {:ok, rewritten} = OrderingStateRewriter.rewrite_row_fields(row, "projects", plan)

    assert rewritten["milestones_ordering_state"] == [
             Paths.milestone_id(destination_one),
             Paths.milestone_id(destination_four),
             Paths.milestone_id(destination_two),
             Paths.milestone_id(destination_three)
           ]
  end

  test "preserves realistic task ordering after dropping an untranslated task" do
    source_one = task("Write tests")
    source_two = task("Review copy")
    source_three = task("Fix bug")
    source_four = task("Deploy")
    source_five = task("Write tests")

    source_state =
      TaskOrderingState.initialize()
      |> TaskOrderingState.add_task(source_one)
      |> TaskOrderingState.add_task(source_two)
      |> TaskOrderingState.add_task(source_three)
      |> TaskOrderingState.add_task(source_four, 1)
      |> TaskOrderingState.add_task(source_two, 3)
      |> TaskOrderingState.add_task(source_five, 2)

    destination_one = destination_task(source_one)
    destination_two = destination_task(source_two)
    destination_four = destination_task(source_four)
    destination_five = destination_task(source_five)

    plan =
      translation_plan(%{
        "tasks" => %{
          source_one.id => destination_one.id,
          source_two.id => destination_two.id,
          source_four.id => destination_four.id,
          source_five.id => destination_five.id
        }
      })

    row = %{"tasks_ordering_state" => source_state}

    assert {:ok, rewritten} = OrderingStateRewriter.rewrite_row_fields(row, "project_milestones", plan)

    assert rewritten["tasks_ordering_state"] == [
             Paths.task_id(destination_one),
             Paths.task_id(destination_four),
             Paths.task_id(destination_five),
             Paths.task_id(destination_two)
           ]
  end

  defp translation_plan(id_map) do
    %TranslationPlan{id_map: id_map, table_index: %{}}
  end

  defp milestone(title) do
    %Milestone{id: Ecto.UUID.generate(), title: title}
  end

  defp destination_milestone(source) do
    %Milestone{id: Ecto.UUID.generate(), title: source.title}
  end

  defp task(name) do
    %Task{id: Ecto.UUID.generate(), name: name}
  end

  defp destination_task(source) do
    %Task{id: Ecto.UUID.generate(), name: source.name}
  end

  defp encoded_id(label, id) do
    Helpers.id_with_comments(label, ShortUuid.encode!(id))
  end
end
