defmodule Operately.Operations.TaskAddingTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Repo
  alias Operately.Tasks.Task
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})
    assignee = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(person)
    project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: group.id})
    milestone = milestone_fixture(person, %{project_id: project.id, title: "Create a milestone"})

    {:ok, person: person, assignee: assignee, milestone: milestone}
  end

  @name "specific name"

  test "TaskAdding operation creates task", ctx do
    assert 0 == Repo.aggregate(Task, :count, :id)

    Operately.Operations.TaskAdding.run(ctx.person, %{
      name: @name,
      assignee_ids: [ctx.assignee.id],
      description: "{}",
      milestone_id: ctx.milestone.id
    })

    task = from(t in Task, where: t.milestone_id == ^ctx.milestone.id, preload: :assignees) |> Repo.one()

    assert task.name == @name
    assert length(task.assignees) == 1
    assert ctx.assignee.id == hd(task.assignees).person_id
  end

  test "TaskAdding operation creates activity", ctx do
    Operately.Operations.TaskAdding.run(ctx.person, %{
      name: @name,
      assignee_ids: [ctx.assignee.id],
      description: "{}",
      milestone_id: ctx.milestone.id
    })

    activity = from(a in Activity, where: a.action == "task_adding" and a.content["milestone_id"] == ^ctx.milestone.id) |> Repo.one()

    assert activity.content["name"] == @name
    assert activity.content["milestone_id"] == ctx.milestone.id
  end
end
