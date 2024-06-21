defmodule Operately.Operations.TaskStatusChangeTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.Repo
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(person)
    project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: group.id})
    milestone = milestone_fixture(person, %{project_id: project.id, title: "Some milestone"})
    task = task_fixture(%{creator_id: person.id, milestone_id: milestone.id, name: "name"})
    assignee_fixture(%{task_id: task.id, person_id: person.id})

    {:ok, person: person, milestone: milestone, task: task}
  end

  test "TaskStatusChange operation updates task and milestone", ctx do
    assert ctx.task.status == "todo"

    Operately.Operations.TaskStatusChange.run(ctx.person, ctx.task.id, "in_progress", 1)

    task = Repo.reload(ctx.task)
    milestone = Repo.reload(ctx.milestone)

    assert task.status == "in_progress"
    assert milestone.tasks_kanban_state == %{"done" => [], "in_progress" => [task.id], "todo" => []}

    Operately.Operations.TaskStatusChange.run(ctx.person, ctx.task.id, "done", 2)

    task = Repo.reload(ctx.task)
    milestone = Repo.reload(ctx.milestone)

    assert task.status == "done"
    assert milestone.tasks_kanban_state == %{"done" => [task.id], "in_progress" => [], "todo" => []}
  end

  test "TaskStatusChange operation creates activity", ctx do
    Operately.Operations.TaskStatusChange.run(ctx.person, ctx.task.id, "in_progress", 1)

    activity = from(a in Activity, where: a.action == "task_status_change" and a.content["task_id"] == ^ctx.task.id) |> Repo.one()

    assert activity.content["task_id"] == ctx.task.id
    assert activity.content["old_status"] == "todo"
    assert activity.content["new_status"] == "in_progress"
  end
end
