defmodule Operately.Data.Change112MergeTemplateKanbanIntoRootTest do
  use Operately.DataCase

  alias Operately.Data.Change112MergeTemplateKanbanIntoRoot, as: Change
  alias Operately.ProjectTemplates.{Milestone, ProjectTemplate}
  alias Operately.Repo
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  test "merges root and milestone kanban columns into the template root", ctx do
    ctx = seed_template(ctx)
    [todo, done | _] = ctx.template.task_statuses

    root_id = Paths.project_template_task_id(ctx.root_task)
    milestone_todo_id = Paths.project_template_task_id(ctx.milestone_todo)
    milestone_done_id = Paths.project_template_task_id(ctx.milestone_done)

    put_kanban!(ctx.template, %{
      todo.value => [root_id],
      done.value => []
    })

    put_milestone_kanban!(ctx.milestone, %{
      todo.value => [milestone_todo_id],
      done.value => [milestone_done_id]
    })

    Change.run()

    template = Repo.get!(ProjectTemplate, ctx.template.id)

    assert template.tasks_kanban_state[todo.value] == [root_id, milestone_todo_id]
    assert template.tasks_kanban_state[done.value] == [milestone_done_id]
  end

  test "appends tasks missing from every kanban map by their status", ctx do
    ctx = seed_template(ctx)
    [todo, done | _] = ctx.template.task_statuses

    root_id = Paths.project_template_task_id(ctx.root_task)
    milestone_done_id = Paths.project_template_task_id(ctx.milestone_done)

    put_kanban!(ctx.template, %{todo.value => [root_id]})
    put_milestone_kanban!(ctx.milestone, %{})

    Change.run()

    template = Repo.get!(ProjectTemplate, ctx.template.id)

    assert template.tasks_kanban_state[todo.value] == [root_id, Paths.project_template_task_id(ctx.milestone_todo)]
    assert template.tasks_kanban_state[done.value] == [milestone_done_id]
  end

  test "keeps first-seen order and is idempotent", ctx do
    ctx = seed_template(ctx)
    [todo | _] = ctx.template.task_statuses

    root_id = Paths.project_template_task_id(ctx.root_task)
    milestone_todo_id = Paths.project_template_task_id(ctx.milestone_todo)

    put_kanban!(ctx.template, %{todo.value => [root_id, milestone_todo_id]})
    put_milestone_kanban!(ctx.milestone, %{todo.value => [milestone_todo_id, root_id]})

    Change.run()
    first = Repo.get!(ProjectTemplate, ctx.template.id).tasks_kanban_state

    Change.run()
    second = Repo.get!(ProjectTemplate, ctx.template.id).tasks_kanban_state

    assert first[todo.value] == [root_id, milestone_todo_id]
    assert second == first
  end

  defp seed_template(ctx) do
    ctx =
      ctx
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_milestone(:milestone, :template, title: "Launch")

    [todo, done | _] = ctx.template.task_statuses

    ctx
    |> Factory.add_project_template_task(:root_task, :template,
      name: "Root",
      task_status: Map.from_struct(todo)
    )
    |> Factory.add_project_template_task(:milestone_todo, :template,
      name: "Milestone todo",
      milestone: :milestone,
      task_status: Map.from_struct(todo)
    )
    |> Factory.add_project_template_task(:milestone_done, :template,
      name: "Milestone done",
      milestone: :milestone,
      task_status: Map.from_struct(done)
    )
  end

  defp put_kanban!(template, state) do
    template
    |> ProjectTemplate.changeset(%{tasks_kanban_state: state})
    |> Repo.update!()
  end

  defp put_milestone_kanban!(milestone, state) do
    milestone
    |> Milestone.changeset(%{tasks_kanban_state: state})
    |> Repo.update!()
  end
end
