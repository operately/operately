defmodule Operately.Operations.ProjectKeyResourceAddingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_contributor(:contrib1, :project)
    |> Factory.add_project_contributor(:contrib2, :project)
    |> Factory.add_project_contributor(:contrib3, :project)
  end

  test "ProjectCreation operation creates activity and notification", ctx do
    {:ok, _} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectKeyResourceAdding.run(ctx.creator, ctx.project, %{
        project_id: ctx.project.id,
        title: "some title",
        link: "https://some-link.com",
        resource_type: "link",
      })
    end)
    action = "project_key_resource_added"

    activity = from(a in Activity, where: a.action == ^action and a.content["project_id"] == ^ctx.project.id) |> Repo.one()

    assert fetch_notifications(activity.id) == []

    perform_job(activity.id)

    assert fetch_notifications(activity.id) != []
    assert notifications_count(action: action) == 3
  end
end
