defmodule Operately.Operations.ProjectResumingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding
  alias Operately.Operations.ProjectResuming
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_project(:project, :space, champion: :champion, reviewer: :reviewer)
    |> Factory.add_project_contributor(:member1, :project, :as_person)
    |> Factory.add_project_contributor(:member2, :project, :as_person)
    |> Factory.add_project_contributor(:member3, :project, :as_person)
    |> Factory.pause_project(:project)
  end

  describe "notifications" do
    test "Resuming project notifies everyone", ctx do
      contributors = Operately.Projects.list_project_contributors(ctx.project)
      subscriber_ids = Enum.map(contributors, & &1.person_id)

      Oban.Testing.with_testing_mode(:manual, fn ->
        resume_project(ctx, true, subscriber_ids)
      end)

      action = "project_resuming"
      activity = get_activity(ctx.project, action)

      assert notifications_count(action: action) == 0

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      contributors
      |> Enum.map(& &1.person_id)
      |> Enum.reject(&(&1 == ctx.creator.id))
      |> Enum.each(fn person_id ->
        assert Enum.member?(notified_people_ids, person_id)
      end)

      assert notifications_count(action: action) == 5
    end

    test "Resuming project notifies selected people", ctx do
      Oban.Testing.with_testing_mode(:manual, fn ->
        resume_project(ctx, false, [ctx.reviewer.id, ctx.champion.id])
      end)

      action = "project_resuming"
      activity = get_activity(ctx.project, action)

      assert notifications_count(action: action) == 0

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      assert notifications_count(action: action) == 2
      assert ctx.reviewer.id in notified_people_ids
      assert ctx.champion.id in notified_people_ids
    end

    test "person without permissions is not notified", ctx do
      project =
        project_fixture(%{
          company_id: ctx.company.id,
          creator_id: ctx.creator.id,
          group_id: ctx.space.id,
          company_access_level: Binding.no_access(),
          space_access_level: Binding.no_access(),
        })

      {:ok, project} =
        project
        |> Project.changeset(%{status: "paused"})
        |> Repo.update()

      person = person_fixture_with_account(%{company_id: ctx.company.id})

      resume_project(%{ctx | project: project}, false, [person.id])

      action = "project_resuming"
      activity = get_activity(project, action)

      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      refute person.id in notified_people_ids
    end
  end

  test "ProjectResuming operation updates project", ctx do
    assert ctx.project.status == "paused"

    {:ok, project} = resume_project(ctx, false, [])

    assert project.status == "active"
  end

  defp resume_project(ctx, send_to_everyone, subscriber_ids) do
    ProjectResuming.run(ctx.creator, ctx.project, %{
      content: RichText.rich_text("Resuming comments"),
      subscription_parent_type: :comment_thread,
      send_to_everyone: send_to_everyone,
      subscriber_ids: subscriber_ids
    })
  end

  defp get_activity(project, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["project_id"] == ^project.id
    )
    |> Repo.one()
  end
end
