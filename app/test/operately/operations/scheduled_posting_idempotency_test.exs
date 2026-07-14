defmodule Operately.Operations.ScheduledPostingIdempotencyTest do
  use Operately.DataCase

  import Ecto.Query
  alias Operately.Support.{Factory, RichText}
  alias Operately.Operations.{
    DiscussionEditing,
    DiscussionPosting,
    GoalCheckIn,
    GoalCheckInEdit,
    ProjectCheckIn,
    ProjectCheckInEdit
  }

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_messages_board(:messages_board, :space)
  end

  test "idempotency of oban jobs when editing a scheduled discussion", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      # 1. Create a scheduled discussion
      time1 = DateTime.utc_now() |> DateTime.add(2, :day)

      {:ok, message} = DiscussionPosting.run(ctx.creator, ctx.space, %{
        messages_board_id: ctx.messages_board.id,
        title: "Title",
        content: RichText.rich_text("Content"),
        post_as_draft: false,
        send_to_everyone: true,
        subscription_parent_type: :message,
        subscriber_ids: [],
        scheduled_at: time1
      })

      # Preload space to simulate what the API controller does
      message = Repo.preload(message, :space)

      assert message.state == :scheduled
      assert_scheduled_job("message", message.id, time1)

      # 2. Reschedule to a new time
      time2 = DateTime.utc_now() |> DateTime.add(3, :day)
      {:ok, message} = DiscussionEditing.run(ctx.creator, message, %{
        title: "Title (Updated)",
        body: RichText.rich_text("Content (Updated)"),
        scheduled_at: time2
      })

      assert message.state == :scheduled
      assert_scheduled_job("message", message.id, time2)

      # 3. Reschedule again
      time3 = DateTime.utc_now() |> DateTime.add(4, :day)
      {:ok, message} = DiscussionEditing.run(ctx.creator, message, %{
        title: "Title (Updated again)",
        body: RichText.rich_text("Content (Updated again)"),
        scheduled_at: time3
      })

      assert message.state == :scheduled
      assert_scheduled_job("message", message.id, time3)

      # 4. Cancel scheduling (convert to draft)
      {:ok, message} = DiscussionEditing.run(ctx.creator, message, %{
        state: :draft,
        body: message.body
      })

      assert message.state == :draft
      assert count_oban_jobs("message", message.id) == 0

      # 5. Reschedule from draft
      {:ok, message} = DiscussionEditing.run(ctx.creator, message, %{
        state: :scheduled,
        scheduled_at: time1,
        body: message.body
      })

      assert message.state == :scheduled
      assert_scheduled_job("message", message.id, time1)

      # 6. Publish immediately
      {:ok, message} = DiscussionEditing.run(ctx.creator, message, %{
        state: :published,
        body: message.body
      })

      assert message.state == :published
      assert count_oban_jobs("message", message.id) == 0
    end)
  end

  test "idempotency of oban jobs when editing a scheduled project check-in", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      time1 = DateTime.utc_now() |> DateTime.add(2, :day)

      {:ok, check_in} =
        ProjectCheckIn.run(ctx.creator, ctx.project, %{
          status: "on_track",
          content: RichText.rich_text("Content"),
          post_as_draft: false,
          send_to_everyone: true,
          subscription_parent_type: :project_check_in,
          subscriber_ids: [],
          scheduled_at: time1
        })

      assert check_in.state == :scheduled
      assert_scheduled_job("project_check_in", check_in.id, time1)

      time2 = DateTime.utc_now() |> DateTime.add(3, :day)

      {:ok, check_in} =
        ProjectCheckInEdit.run(ctx.creator, check_in, %{
          status: "on_track",
          description: RichText.rich_text("Content (Updated)"),
          scheduled_at: time2
        })

      assert check_in.state == :scheduled
      assert_scheduled_job("project_check_in", check_in.id, time2)

      time3 = DateTime.utc_now() |> DateTime.add(4, :day)

      {:ok, check_in} =
        ProjectCheckInEdit.run(ctx.creator, check_in, %{
          status: "on_track",
          description: RichText.rich_text("Content (Updated again)"),
          scheduled_at: time3
        })

      assert check_in.state == :scheduled
      assert_scheduled_job("project_check_in", check_in.id, time3)

      {:ok, check_in} =
        ProjectCheckInEdit.run(ctx.creator, check_in, %{
          state: :draft,
          status: check_in.status,
          description: check_in.description
        })

      assert check_in.state == :draft
      assert count_oban_jobs("project_check_in", check_in.id) == 0

      {:ok, check_in} =
        ProjectCheckInEdit.run(ctx.creator, check_in, %{
          state: :scheduled,
          status: check_in.status,
          description: check_in.description,
          scheduled_at: time1
        })

      assert check_in.state == :scheduled
      assert_scheduled_job("project_check_in", check_in.id, time1)

      {:ok, check_in} =
        ProjectCheckInEdit.run(ctx.creator, check_in, %{
          state: :published,
          status: check_in.status,
          description: check_in.description
        })

      assert check_in.state == :published
      assert count_oban_jobs("project_check_in", check_in.id) == 0
    end)
  end

  test "idempotency of oban jobs when editing a scheduled goal check-in", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      time1 = DateTime.utc_now() |> DateTime.add(2, :day)

      {:ok, update} =
        GoalCheckIn.run(ctx.creator, ctx.goal, %{
          status: "on_track",
          content: RichText.rich_text("Content"),
          target_values: nil,
          checklist: nil,
          post_as_draft: false,
          send_to_everyone: true,
          subscription_parent_type: :goal_update,
          subscriber_ids: [],
          scheduled_at: time1
        })

      assert update.state == :scheduled
      assert_scheduled_job("goal_update", update.id, time1)

      time2 = DateTime.utc_now() |> DateTime.add(3, :day)

      {:ok, update} =
        GoalCheckInEdit.run(ctx.creator, ctx.goal, update, %{
          status: "on_track",
          content: RichText.rich_text("Content (Updated)"),
          new_target_values: [],
          checklist: [],
          scheduled_at: time2
        })

      assert update.state == :scheduled
      assert_scheduled_job("goal_update", update.id, time2)

      time3 = DateTime.utc_now() |> DateTime.add(4, :day)

      {:ok, update} =
        GoalCheckInEdit.run(ctx.creator, ctx.goal, update, %{
          status: "on_track",
          content: RichText.rich_text("Content (Updated again)"),
          new_target_values: [],
          checklist: [],
          scheduled_at: time3
        })

      assert update.state == :scheduled
      assert_scheduled_job("goal_update", update.id, time3)

      {:ok, update} =
        GoalCheckInEdit.run(ctx.creator, ctx.goal, update, %{
          state: :draft,
          status: update.status,
          content: update.message,
          new_target_values: [],
          checklist: []
        })

      assert update.state == :draft
      assert count_oban_jobs("goal_update", update.id) == 0

      {:ok, update} =
        GoalCheckInEdit.run(ctx.creator, ctx.goal, update, %{
          state: :scheduled,
          status: update.status,
          content: update.message,
          new_target_values: [],
          checklist: [],
          scheduled_at: time1
        })

      assert update.state == :scheduled
      assert_scheduled_job("goal_update", update.id, time1)

      {:ok, update} =
        GoalCheckInEdit.run(ctx.creator, ctx.goal, update, %{
          state: :published,
          status: update.status,
          content: update.message,
          new_target_values: [],
          checklist: []
        })

      assert update.state == :published
      assert count_oban_jobs("goal_update", update.id) == 0
    end)
  end

  defp assert_scheduled_job(type, id, scheduled_at) do
    assert count_oban_jobs(type, id) == 1
    assert scheduled_job(type, id).scheduled_at == scheduled_at
  end

  defp count_oban_jobs(type, id) do
    from(j in Oban.Job,
      where: j.worker == "Operately.AsyncPublishing.Worker",
      where: fragment("args->>'type' = ?", ^type),
      where: fragment("args->>'id' = ?", ^id)
    )
    |> Repo.aggregate(:count, :id)
  end

  defp scheduled_job(type, id) do
    from(j in Oban.Job,
      where: j.worker == "Operately.AsyncPublishing.Worker",
      where: fragment("args->>'type' = ?", ^type),
      where: fragment("args->>'id' = ?", ^id)
    )
    |> Repo.one!()
  end
end
