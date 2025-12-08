defmodule Operately.Support.Features.StatusCustomizationSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.UI
  alias OperatelyWeb.Paths
  alias Wallaby.Query

  step :setup_project, ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Product Space")
    |> Factory.add_space_member(:champion, :space, name: "Casey Champion")
    |> Factory.add_project(:project, :space, name: "Status Customization", champion: :champion)
    |> Factory.add_project_milestone(:milestone, :project, title: "Kickoff")
    |> Factory.log_in_person(:champion)
  end

  step :given_task_exists, ctx, opts \\ [] do
    name = Keyword.get(opts, :name, "Task #{System.unique_integer([:positive])}")
    key = Keyword.get(opts, :as, :task)

    ctx
    |> Factory.add_project_task(key, :milestone, name: name, project_id: ctx.project.id)
  end

  step :visit_project_tasks, ctx do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "tab-tasks")
    |> UI.assert_has(testid: "tasks-board")
  end

  step :open_manage_statuses, ctx do
    ctx
    |> UI.click(css: "button[aria-label=\"Settings\"]")
    |> UI.click_text("Manage statuses")
    |> UI.sleep(200)
  end

  step :add_custom_status, ctx, label: label, color: color do
    ctx
    |> UI.click_button("Add status")
    |> UI.fill(testid: "status-label-input-4", with: label)
    |> UI.click(testid: "status-color-picker-4")
    |> UI.click_text(color_description(color))
    |> Map.put(:custom_status, %{label: label, value: status_value(label), color: color})
  end

  step :rename_status, ctx, old_label: old_label, new_label: new_label do
    ctx
    |> UI.fill(status_input_with_label(old_label), with: new_label)
    |> Map.put(:renamed_status, %{from: old_label, to: new_label})
  end

  step :remove_last_status, ctx do
    UI.click(ctx, testid: "remove-status-4")
  end

  step :save_status_changes, ctx do
    ctx
    |> UI.click_button("Save changes")
    |> UI.sleep(500)
  end

  step :assert_status_exists, ctx, label: label, color: color do
    assert_status(ctx, label, color)
  end

  step :assert_status_absent, ctx, label: label do
    project = reload_project(ctx)

    refute Enum.any?(project.task_statuses, &(&1.label == label))

    Map.put(ctx, :project, project)
  end

  step :open_task_from_tasks_board, ctx, task_key \\ :task do
    task = Map.fetch!(ctx, task_key)

    ctx
    |> UI.click_link(task.name)
    |> UI.assert_page(Paths.project_task_path(ctx.company, task))
  end

  step :change_task_status_on_task_page, ctx, opts do
    current_label = Keyword.fetch!(opts, :current_label)
    new_value = Keyword.fetch!(opts, :new_value)

    ctx
    |> UI.click_text(current_label)
    |> UI.click(testid: UI.testid(["status-option", new_value]))
    |> UI.sleep(400)
  end

  step :assert_task_status, ctx, label: label do
    task = Map.fetch!(ctx, :task)
    task = Operately.Repo.get!(Operately.Tasks.Task, task.id)

    assert task.task_status
    assert task.task_status.label == label

    Map.put(ctx, :task, task)
  end

  step :assert_task_status_color, ctx, color: color do
    task = Map.fetch!(ctx, :task)
    task = Operately.Repo.get!(Operately.Tasks.Task, task.id)

    assert task.task_status
    assert task.task_status.color == color

    Map.put(ctx, :task, task)
  end

  step :open_status_selector_on_task_page, ctx, label: label do
    ctx
    |> UI.find(UI.query(testid: "task-header"), fn el ->
      UI.click_text(el, label)
    end)
  end

  step :assert_status_option_absent, ctx, value: value do
    ctx |> UI.refute_has(testid: UI.testid(["status-option", value]))
  end

  step :close_status_selector, ctx do
    ctx |> UI.send_keys([:escape]) |> UI.sleep(200)
  end

  step :assert_task_status_visible, ctx, label: label do
    ctx |> UI.assert_text(label)
  end

  defp color_description(:gray), do: "Use for backlog or paused work"
  defp color_description(:blue), do: "Active work underway"
  defp color_description(:green), do: "Completed or approved"
  defp color_description(:red), do: "Blocked or intentionally stopped"

  def status_value(label) do
    label
    |> String.downcase()
    |> String.replace(~r/\s+/, "_")
  end

  defp status_input_with_label(label) do
    Query.css("div[role=\"dialog\"] input[value=\"#{label}\"]")
  end

  defp reload_project(ctx) do
    Operately.Repo.get!(Operately.Projects.Project, ctx.project.id)
  end

  defp assert_status(ctx, label, color) do
    project = reload_project(ctx)
    status = Enum.find(project.task_statuses, &(&1.label == label))

    assert status, "Expected to find status #{label} but none matched"

    if color, do: assert(status.color == color)

    Map.put(ctx, :project, project)
  end
end
