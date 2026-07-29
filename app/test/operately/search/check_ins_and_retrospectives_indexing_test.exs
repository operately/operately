defmodule Operately.Search.CheckInsAndRetrospectivesIndexingTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.AsyncPublishing.ScheduledPostPublishing

  alias Operately.Operations.{
    GoalCheckIn,
    GoalCheckInEdit,
    GoalCheckInDeleting,
    GoalClosing,
    GoalDeleting,
    GoalReopening,
    ProjectCheckIn,
    ProjectCheckInEdit,
    ProjectCheckInDeleting,
    ProjectClosed,
    ProjectRetrospectiveEditing,
    SpaceDeleting
  }

  alias Operately.Search.{Entry, SourceIndexer}
  alias Operately.Search.IndexUpdates.Worker
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)

    Repo.delete_all(Oban.Job)
    ctx
  end

  test "published check-in creates, edits, and deletes maintain their entries", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, project_check_in} =
               ProjectCheckIn.run(ctx.creator, ctx.project, project_check_in_attrs("Project evidence"))

      assert {:ok, goal_check_in} =
               GoalCheckIn.run(ctx.creator, ctx.goal, goal_check_in_attrs("Goal evidence"))

      run_refresh_jobs()

      assert_entry(:project_check_in, project_check_in.id, body: "Project evidence")
      assert_entry(:goal_check_in, goal_check_in.id, body: "Goal evidence")

      assert {:ok, project_check_in} =
               ProjectCheckInEdit.run(ctx.creator, project_check_in, %{
                 status: "on_track",
                 description: RichText.rich_text("Updated project evidence"),
                 state: nil,
                 scheduled_at: nil
               })

      goal = Repo.preload(ctx.goal, [:targets, :checks])
      goal_check_in = Repo.preload(goal_check_in, :goal)

      assert {:ok, goal_check_in} =
               GoalCheckInEdit.run(ctx.creator, goal, goal_check_in, %{
                 status: "on_track",
                 content: RichText.rich_text("Updated goal evidence"),
                 new_target_values: [],
                 checklist: [],
                 due_date: nil,
                 state: nil,
                 scheduled_at: nil
               })

      run_refresh_jobs()
      assert_entry(:project_check_in, project_check_in.id, body: "Updated project evidence")
      assert_entry(:goal_check_in, goal_check_in.id, body: "Updated goal evidence")

      assert {:ok, _project_check_in} = ProjectCheckInDeleting.run(project_check_in)
      assert {:ok, _goal_check_in} = GoalCheckInDeleting.run(goal_check_in)

      refute_entry(:project_check_in, project_check_in.id)
      refute_entry(:goal_check_in, goal_check_in.id)
    end)
  end

  test "scheduled publication creates the first searchable check-in entries", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, project_check_in} =
               ProjectCheckIn.run(
                 ctx.creator,
                 ctx.project,
                 Map.put(project_check_in_attrs("Scheduled project evidence"), :post_as_draft, true)
               )

      assert {:ok, goal_check_in} =
               GoalCheckIn.run(
                 ctx.creator,
                 ctx.goal,
                 Map.put(goal_check_in_attrs("Scheduled goal evidence"), :post_as_draft, true)
               )

      run_refresh_jobs()
      refute_entry(:project_check_in, project_check_in.id)
      refute_entry(:goal_check_in, goal_check_in.id)

      project_check_in = schedule(project_check_in)
      goal_check_in = schedule(goal_check_in)

      assert {:ok, %{state: :published}} = ScheduledPostPublishing.run("project_check_in", project_check_in.id)
      assert {:ok, %{state: :published}} = ScheduledPostPublishing.run("goal_update", goal_check_in.id)

      run_refresh_jobs()
      assert_entry(:project_check_in, project_check_in.id, body: "Scheduled project evidence")
      assert_entry(:goal_check_in, goal_check_in.id, body: "Scheduled goal evidence")
    end)
  end

  test "project close and retrospective edit refresh content and parent state", ctx do
    ctx = Factory.add_project_check_in(ctx, :check_in, :project, :creator)
    sync("project_check_in", ctx.check_in.id)

    close_attrs = %{
      success_status: "achieved",
      content: RichText.rich_text("Initial retrospective"),
      subscription_parent_type: :project_retrospective,
      send_to_everyone: false,
      subscriber_ids: []
    }

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, retrospective} = ProjectClosed.run(ctx.creator, ctx.project, close_attrs)
      run_refresh_jobs()

      assert_entry(:project_check_in, ctx.check_in.id, state: :closed)
      assert_entry(:project_retrospective, retrospective.id, body: "Initial retrospective", state: :closed)

      retrospective = Repo.preload(retrospective, :project)

      assert {:ok, _retrospective} =
               ProjectRetrospectiveEditing.run(ctx.creator, retrospective, %{
                 content: RichText.rich_text("Updated retrospective"),
                 success_status: :achieved
               })

      run_refresh_jobs()
      assert_entry(:project_retrospective, retrospective.id, body: "Updated retrospective")
    end)
  end

  test "goal close and reopen refresh every check-in state", ctx do
    ctx = Factory.add_goal_update(ctx, :check_in, :goal, :creator)
    sync("goal_check_in", ctx.check_in.id)

    close_attrs = %{
      success: "success",
      success_status: "achieved",
      content: RichText.rich_text("Closing comments"),
      subscription_parent_type: :comment_thread,
      send_to_everyone: false,
      subscriber_ids: []
    }

    reopen_attrs = %{
      content: RichText.rich_text("Reopening comments"),
      subscription_parent_type: :comment_thread,
      send_to_everyone: false,
      subscriber_ids: []
    }

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, closed_goal} = GoalClosing.run(ctx.creator, ctx.goal, close_attrs)
      run_refresh_jobs()
      assert_entry(:goal_check_in, ctx.check_in.id, state: :closed)

      assert {:ok, _goal} = GoalReopening.run(ctx.creator, closed_goal, reopen_attrs)
      run_refresh_jobs()
      assert_entry(:goal_check_in, ctx.check_in.id, state: nil)
    end)
  end

  test "archiving a project removes its check-in and retrospective entries", ctx do
    ctx =
      ctx
      |> Factory.add_project_check_in(:check_in, :project, :creator)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)

    sync("project_check_in", ctx.check_in.id)
    sync("project_retrospective", ctx.retrospective.id)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, _project} = Operately.Projects.archive_project(ctx.creator, ctx.project)
      run_refresh_jobs()

      refute_entry(:project_check_in, ctx.check_in.id)
      refute_entry(:project_retrospective, ctx.retrospective.id)
    end)
  end

  test "hard parent deletion synchronously removes every scoped check-in and retrospective entry", ctx do
    ctx =
      ctx
      |> Factory.add_project_check_in(:project_check_in, :project, :creator)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)
      |> Factory.add_goal_update(:goal_check_in, :goal, :creator)

    sync("project_check_in", ctx.project_check_in.id)
    sync("project_retrospective", ctx.retrospective.id)
    sync("goal_check_in", ctx.goal_check_in.id)

    assert {:ok, _project} = Operately.Projects.delete_project(ctx.project)
    refute_entry(:project_check_in, ctx.project_check_in.id)
    refute_entry(:project_retrospective, ctx.retrospective.id)

    assert {:ok, _goal} = GoalDeleting.run(ctx.goal)
    refute_entry(:goal_check_in, ctx.goal_check_in.id)
  end

  test "space deletion synchronously removes every check-in and retrospective entry in the space", ctx do
    ctx =
      ctx
      |> Factory.add_project_check_in(:project_check_in, :project, :creator)
      |> Factory.add_project_retrospective(:retrospective, :project, :creator)
      |> Factory.add_goal_update(:goal_check_in, :goal, :creator)

    sync("project_check_in", ctx.project_check_in.id)
    sync("project_retrospective", ctx.retrospective.id)
    sync("goal_check_in", ctx.goal_check_in.id)

    assert {:ok, _space} = ctx.space |> Repo.preload(:company) |> SpaceDeleting.run()

    refute_entry(:project_check_in, ctx.project_check_in.id)
    refute_entry(:project_retrospective, ctx.retrospective.id)
    refute_entry(:goal_check_in, ctx.goal_check_in.id)
  end

  defp project_check_in_attrs(content) do
    %{
      status: "on_track",
      content: RichText.rich_text(content),
      send_to_everyone: false,
      subscriber_ids: [],
      subscription_parent_type: :project_check_in
    }
  end

  defp goal_check_in_attrs(content) do
    %{
      status: "on_track",
      content: RichText.rich_text(content),
      target_values: [],
      checklist: [],
      due_date: nil,
      send_to_everyone: false,
      subscriber_ids: [],
      subscription_parent_type: :goal_update
    }
  end

  defp schedule(record) do
    record
    |> Ecto.Changeset.change(state: :scheduled, scheduled_at: Operately.Time.days_from_now(1))
    |> Repo.update!()
  end

  defp sync(source_type, source_id) do
    assert {:ok, _summary} = SourceIndexer.sync(source_type, source_id)
  end

  defp run_refresh_jobs do
    jobs = all_enqueued(worker: Worker)
    assert jobs != []

    Enum.each(jobs, fn job ->
      assert :ok = perform_job(Worker, job.args)
      Repo.delete!(job)
    end)
  end

  defp assert_entry(source_type, source_id, expected) do
    entry = Repo.get_by!(Entry, source_type: source_type, source_id: source_id)
    Enum.each(expected, fn {field, value} -> assert Map.fetch!(entry, field) == value end)
    entry
  end

  defp refute_entry(source_type, source_id) do
    refute Repo.get_by(Entry, source_type: source_type, source_id: source_id)
  end
end
