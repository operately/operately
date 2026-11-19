defmodule Operately.Features.ProjectMilestones.CompletionShortcutsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectMilestones.CompletionShortcutsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "complete an empty milestone from the project tasks tab", ctx do
    ctx
    |> Steps.visit_tasks()
    |> Steps.complete_empty_from_tasks()
    |> Steps.assert_completed_in_tasks()
    |> Steps.assert_completed()
  end

  feature "complete from the project tasks tab and move open tasks out of the milestone", ctx do
    ctx
    |> Steps.add_task()
    |> Steps.visit_tasks()
    |> Steps.complete_from_tasks()
    |> Steps.submit_resolution()
    |> Steps.assert_completed_in_tasks()
    |> Steps.assert_task_moved_out()
    |> Steps.assert_completed()
  end

  feature "complete from the project tasks tab and close the remaining tasks", ctx do
    ctx
    |> Steps.add_task()
    |> Steps.visit_tasks()
    |> Steps.complete_from_tasks()
    |> Steps.choose_closed_status()
    |> Steps.submit_resolution()
    |> Steps.assert_completed_in_tasks()
    |> Steps.assert_task_closed()
    |> Steps.assert_completed()
  end
end
