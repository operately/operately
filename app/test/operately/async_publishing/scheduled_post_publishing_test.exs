defmodule Operately.AsyncPublishing.ScheduledPostPublishingTest do
  use Operately.DataCase

  alias Operately.Support.Factory
  alias Operately.AsyncPublishing.ScheduledPostPublishing
  import Ecto.Query

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_messages_board(:messages_board, :space)
  end

  test "publishing a scheduled project check_in", ctx do
    # create a draft check in
    {:ok, check_in} = Operately.Operations.ProjectCheckIn.run(ctx.creator, ctx.project, %{
      status: "on_track",
      content: %{message: "Test content"},
      post_as_draft: true,
      subscription_parent_type: :project_check_in,
      send_to_everyone: false,
      subscriber_ids: []
    })

    # move to scheduled
    check_in =
      check_in
      |> Operately.Projects.CheckIn.changeset(%{state: :scheduled, scheduled_at: Operately.Time.days_from_now(1)})
      |> Operately.Repo.update!()

    refute Repo.one(from a in Operately.Activities.Activity, where: a.action == "project_check_in_submitted")

    # Run the operation
    assert {:ok, published_check_in} = ScheduledPostPublishing.run("project_check_in", check_in.id)

    # Verify state and published_at
    assert published_check_in.state == :published
    assert published_check_in.published_at != nil
    assert published_check_in.scheduled_at == nil

    # Verify project's last_check_in was updated
    project = Operately.Repo.get!(Operately.Projects.Project, ctx.project.id)
    assert project.last_check_in_id == check_in.id

    # Verify activity was inserted
    activity = Operately.Repo.one(from a in Operately.Activities.Activity, where: a.action == "project_check_in_submitted")
    assert activity != nil
    assert activity.content["check_in_id"] == check_in.id
  end

  test "publishing a scheduled goal update", ctx do
    {:ok, update} = Operately.Operations.GoalCheckIn.run(ctx.creator, ctx.goal, %{
      status: "on_track",
      content: %{message: "Test content"},
      target_values: nil,
      checklist: nil,
      post_as_draft: true,
      subscription_parent_type: :goal_update,
      send_to_everyone: false,
      subscriber_ids: []
    })

    update =
      update
      |> Operately.Goals.Update.changeset(%{state: :scheduled, scheduled_at: Operately.Time.days_from_now(1)})
      |> Operately.Repo.update!()

    refute Repo.one(from a in Operately.Activities.Activity, where: a.action == "goal_check_in")

    assert {:ok, published_update} = ScheduledPostPublishing.run("goal_update", update.id)

    assert published_update.state == :published
    assert published_update.published_at != nil
    assert published_update.scheduled_at == nil

    goal = Operately.Repo.get!(Operately.Goals.Goal, ctx.goal.id)
    assert goal.last_check_in_id == update.id

    activity = Operately.Repo.one(from a in Operately.Activities.Activity, where: a.action == "goal_check_in")
    assert activity != nil
    assert activity.content["update_id"] == update.id
  end

  test "publishing a scheduled message", ctx do
    {:ok, message} = Operately.Operations.DiscussionPosting.run(ctx.creator, ctx.space, %{
      messages_board_id: ctx.messages_board.id,
      title: "Title",
      content: %{message: "Content"},
      post_as_draft: true,
      send_to_everyone: false,
      subscription_parent_type: :message,
      subscriber_ids: []
    })

    message =
      message
      |> Operately.Messages.Message.changeset(%{state: :scheduled, scheduled_at: Operately.Time.days_from_now(1)})
      |> Operately.Repo.update!()

    refute Repo.one(from a in Operately.Activities.Activity, where: a.action == "discussion_posting")

    assert {:ok, published_message} = ScheduledPostPublishing.run("message", message.id)

    assert published_message.state == :published
    assert published_message.published_at != nil
    assert published_message.scheduled_at == nil

    activity = Operately.Repo.one(from a in Operately.Activities.Activity, where: a.action == "discussion_posting")
    assert activity != nil
    assert activity.content["discussion_id"] == message.id
  end

  test "skips if not found or not scheduled", ctx do
    Operately.Repo.insert!(%Operately.Messages.Message{
      id: Ecto.UUID.generate(),
      messages_board_id: ctx.messages_board.id,
      author_id: ctx.creator.id,
      title: "Title",
      body: %{message: "Body"},
      state: :draft
    })

    assert {:ok, :skipped} = ScheduledPostPublishing.run("message", Ecto.UUID.generate())
  end
end
