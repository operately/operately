defmodule Operately.Operations.ProjectClosedTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding
  alias Operately.Support.RichText

  @action "project_closed"
  @retrospective_content %{
    "whatWentWell" => RichText.rich_text("some content"),
    "whatDidYouLearn" => RichText.rich_text("some content"),
    "whatCouldHaveGoneBetter" => RichText.rich_text("some content"),
  }

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_project(:project, :space, reviewer: :reviewer)
    |> Factory.add_project_contributor(:contrib1, :project, :as_person)
    |> Factory.add_project_contributor(:contrib2, :project, :as_person)
    |> Factory.add_project_contributor(:contrib3, :project, :as_person)
  end

  test "Closing project notifies only reviewer", ctx do
    {:ok, retrospective} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectClosed.run(ctx.creator, ctx.project, %{
        retrospective: @retrospective_content,
        content: %{},
        send_to_everyone: false,
        subscription_parent_type: :project_retrospective,
        subscriber_ids: [ctx.creator.id, ctx.reviewer.id]
      })
    end)
    activity = get_activity(retrospective)

    assert 0 == notifications_count(action: @action)

    perform_job(activity.id)

    assert 1 == notifications_count(action: @action)

    notifications = fetch_notifications(activity.id, action: @action)

    assert Enum.find(notifications, &(&1.person_id == ctx.reviewer.id))
  end

  test "Closing project notifies contributors", ctx do
    contributors = Operately.Projects.list_project_contributors(ctx.project)

    {:ok, retrospective} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectClosed.run(ctx.creator, ctx.project, %{
        retrospective: @retrospective_content,
        content: %{},
        send_to_everyone: false,
        subscription_parent_type: :project_retrospective,
        subscriber_ids: Enum.map(contributors, &(&1.person_id)),
      })
    end)
    activity = get_activity(retrospective)

    assert 0 == notifications_count(action: @action)

    perform_job(activity.id)

    assert 4 == notifications_count(action: @action)

    notifications = fetch_notifications(activity.id, action: @action)

    contributors
    |> Enum.filter(&(&1.person_id != ctx.creator.id))
    |> Enum.each(fn c ->
      assert Enum.find(notifications, &(&1.person_id == c.person_id))
    end)
  end

  test "Closing project notifies all contributors if send_to_everyone is true", ctx do
    {:ok, retrospective} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectClosed.run(ctx.creator, ctx.project, %{
        retrospective: @retrospective_content,
        content: %{},
        send_to_everyone: true,
        subscription_parent_type: :project_retrospective,
        subscriber_ids: [],
      })
    end)
    activity = get_activity(retrospective)

    assert 0 == notifications_count(action: @action)

    perform_job(activity.id)

    assert 4 == notifications_count(action: @action)

    notifications = fetch_notifications(activity.id, action: @action)

    Operately.Projects.list_project_contributors(ctx.project)
    |> Enum.filter(&(&1.person_id != ctx.creator.id))
    |> Enum.each(fn c ->
      assert Enum.find(notifications, &(&1.person_id == c.person_id))
    end)
  end

  test "Closing project does not notify creator", ctx do
    {:ok, retrospective} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectClosed.run(ctx.creator, ctx.project, %{
        retrospective: @retrospective_content,
        content: %{},
        send_to_everyone: false,
        subscription_parent_type: :project_retrospective,
        subscriber_ids: [ctx.creator.id],
      })
    end)

    activity = get_activity(retrospective)
    perform_job(activity.id)

    assert 0 == notifications_count(action: @action)
  end

  test "Closing project notifies mentioned person", ctx do
    content = %{
      "whatWentWell" => RichText.rich_text(mentioned_people: [ctx.reviewer, ctx.contrib1]) |> Jason.decode!(),
      "whatDidYouLearn" => RichText.rich_text(mentioned_people: [ctx.contrib2]) |> Jason.decode!(),
      "whatCouldHaveGoneBetter" => RichText.rich_text(mentioned_people: [ctx.contrib3]) |> Jason.decode!(),
    }

    {:ok, retrospective} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectClosed.run(ctx.creator, ctx.project, %{
        retrospective: content,
        content: %{
          "content" => [
            content["whatWentWell"],
            content["whatDidYouLearn"],
            content["whatCouldHaveGoneBetter"],
          ],
        },
        send_to_everyone: false,
        subscription_parent_type: :project_retrospective,
        subscriber_ids: [],
      })
    end)
    activity = get_activity(retrospective)

    assert 0 == notifications_count(action: @action)

    perform_job(activity.id)

    assert 4 == notifications_count(action: @action)

    notifications = fetch_notifications(activity.id, action: @action)

    Operately.Projects.list_project_contributors(ctx.project)
    |> Enum.filter(&(&1.person_id != ctx.creator.id))
    |> Enum.each(fn c ->
      assert Enum.find(notifications, &(&1.person_id == c.person_id))
    end)
  end

  test "Doesn't notify person without view access", ctx do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      group_id: ctx.space.id,
      company_access_level: Binding.no_access(),
    })
    person = person_fixture_with_account(%{company_id: ctx.company.id})

    content = %{
      "whatWentWell" => RichText.rich_text(mentioned_people: [person]) |> Jason.decode!(),
      "whatDidYouLearn" => RichText.rich_text("Content"),
      "whatCouldHaveGoneBetter" => RichText.rich_text("Content"),
    }

    {:ok, retrospective} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ProjectClosed.run(ctx.creator, project, %{
        retrospective: content,
        content: %{
          "content" => [
            content["whatWentWell"],
            content["whatDidYouLearn"],
            content["whatCouldHaveGoneBetter"],
          ],
        },
        send_to_everyone: false,
        subscription_parent_type: :project_retrospective,
        subscriber_ids: [],
      })
    end)

    activity = get_activity(retrospective)

    assert notifications_count(action: @action) == 0
    assert fetch_notifications(activity.id, action: @action) == []
  end

  #
  # Helpers
  #

  defp get_activity(retrospective) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^@action and a.content["retrospective_id"] == ^retrospective.id
    )
    |> Repo.one()
  end
end
