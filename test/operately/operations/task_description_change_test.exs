defmodule Operately.Operations.TaskDescriptionChangeTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  import Operately.Support.RichText
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

    {:ok, person: person, task: task, group: group}
  end

  test "TaskDescriptionChange operation updates task", ctx do
    description_text = "some description"
    description = rich_text(description_text)

    Operately.Operations.TaskDescriptionChange.run(ctx.person, ctx.task.id, description)

    task = Repo.reload(ctx.task)

    assert description_text == task.description["content"] |> hd() |> Map.get("content") |> hd() |> Map.get("text")
  end

  test "TaskDescriptionChange operation creates activity", ctx do
    Operately.Operations.TaskDescriptionChange.run(ctx.person, ctx.task.id, rich_text("some description"))

    activity = from(a in Activity, where: a.action == "task_description_change" and a.content["task_id"] == ^ctx.task.id) |> Repo.one()

    assert activity.content["task_id"] == ctx.task.id
    assert activity.content["space_id"] == ctx.group.id
  end
end
