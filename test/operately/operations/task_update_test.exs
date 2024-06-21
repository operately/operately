defmodule Operately.Operations.TaskUpdateTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.Repo
  alias Operately.Tasks.Task
  alias Operately.Activities.Activity

  @prev_name "name"
  @new_name "new name"

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(person)
    project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: group.id})
    milestone = milestone_fixture(person, %{project_id: project.id, title: "Some milestone"})
    task = task_fixture(%{creator_id: person.id, milestone_id: milestone.id, name: @prev_name})
    assignee_fixture(%{task_id: task.id, person_id: person.id})

    {:ok, company: company, person: person, task: task}
  end

  test "TaskUpdate operation updates task", ctx do
    task = Repo.preload(ctx.task, :assignees)

    assert task.name == @prev_name
    assert length(task.assignees) == 1
    assert ctx.person.id == hd(task.assignees).person_id

    new_assignee = person_fixture_with_account(%{company_id: ctx.company.id})

    Operately.Operations.TaskUpdate.run(ctx.person, task.id, @new_name, [new_assignee.id])

    task = from(t in Task, preload: :assignees) |> Repo.one()

    assert task.name == @new_name
    assert length(task.assignees) == 1
    assert new_assignee.id == hd(task.assignees).person_id
  end

  test "TaskUpdate operation creates activity", ctx do
    Operately.Operations.TaskUpdate.run(ctx.person, ctx.task.id, @new_name, [ctx.person.id])

    activity = from(a in Activity, where: a.action == "task_update" and a.content["task_id"] == ^ctx.task.id) |> Repo.one()

    assert activity.content["task_id"] == ctx.task.id
    assert activity.content["old_name"] == @prev_name
    assert activity.content["new_name"] == @new_name
  end
end
