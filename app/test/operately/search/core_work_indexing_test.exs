defmodule Operately.Search.CoreWorkIndexingTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Operations.{
    DiscussionEditing,
    GoalClosing,
    GoalDeleting,
    GoalReopening,
    MessageArchiving,
    SpaceDeleting
  }

  alias Operately.AsyncPublishing.ScheduledPostPublishing
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
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board)

    Repo.delete_all(Oban.Job)
    ctx
  end

  test "project edits and archives refresh the indexed title and state", ctx do
    sync("project", ctx.project.id)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, project} = Operately.Projects.rename_project(ctx.creator, ctx.project, "Renamed project")
      assert_entry(:project, project.id, title: ctx.project.name)
      run_refresh_jobs()
      assert_entry(:project, project.id, title: "Renamed project")

      assert {:ok, archived} = Operately.Projects.archive_project(ctx.creator, project)
      assert_entry(:project, project.id, state: nil)
      run_refresh_jobs()
      assert archived.deleted_at
      assert_entry(:project, project.id, state: :archived)
    end)
  end

  test "goal close and reopen operations refresh indexed state", ctx do
    sync("goal", ctx.goal.id)

    attrs = %{
      success: "success",
      success_status: "achieved",
      content: RichText.rich_text("Closing comments"),
      subscription_parent_type: :comment_thread,
      send_to_everyone: false,
      subscriber_ids: []
    }

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, closed} = GoalClosing.run(ctx.creator, ctx.goal, attrs)
      run_refresh_jobs()
      assert_entry(:goal, ctx.goal.id, state: :closed)

      reopen_attrs = %{
        content: RichText.rich_text("Reopening comments"),
        subscription_parent_type: :comment_thread,
        send_to_everyone: false,
        subscriber_ids: []
      }

      assert {:ok, _goal} = GoalReopening.run(ctx.creator, closed, reopen_attrs)
      run_refresh_jobs()
      assert_entry(:goal, ctx.goal.id, state: nil)
    end)
  end

  test "discussion edits and archives refresh content while preserving archived results", ctx do
    sync("discussion", ctx.discussion.id)
    discussion = Repo.preload(ctx.discussion, :space)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, edited} =
               DiscussionEditing.run(ctx.creator, discussion, %{
                 title: "Renamed discussion",
                 body: RichText.rich_text("Updated findings"),
                 scheduled_at: nil,
                 state: nil
               })

      run_refresh_jobs()
      assert_entry(:discussion, edited.id, title: "Renamed discussion", body: "Updated findings")

      assert {:ok, _changes} = MessageArchiving.run(ctx.creator, edited)
      run_refresh_jobs()
      assert_entry(:discussion, edited.id, state: :archived)
    end)
  end

  test "scheduled discussion publishing queues its first searchable entry", ctx do
    scheduled =
      ctx
      |> Factory.add_message(:scheduled_discussion, :board,
        title: "Scheduled research",
        state: :scheduled,
        scheduled_at: Operately.Time.days_from_now(1)
      )
      |> Map.fetch!(:scheduled_discussion)

    sync("discussion", scheduled.id)
    refute_entry(:discussion, scheduled.id)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, published} = ScheduledPostPublishing.run("message", scheduled.id)
      assert published.state == :published
      run_refresh_jobs()
      assert_entry(:discussion, scheduled.id, title: "Scheduled research")
    end)
  end

  test "goal and space deletion synchronously remove scoped entries", ctx do
    sync("project", ctx.project.id)
    sync("goal", ctx.goal.id)
    sync("discussion", ctx.discussion.id)

    assert {:ok, _goal} = GoalDeleting.run(ctx.goal)
    refute_entry(:goal, ctx.goal.id)
    assert_entry(:project, ctx.project.id)
    assert_entry(:discussion, ctx.discussion.id)

    assert {:ok, _space} = ctx.space |> Repo.preload(:company) |> SpaceDeleting.run()
    refute_entry(:project, ctx.project.id)
    refute_entry(:discussion, ctx.discussion.id)
  end

  test "direct project deletion synchronously removes its scoped entries", ctx do
    sync("project", ctx.project.id)

    assert {:ok, _project} = Operately.Projects.delete_project(ctx.project)
    refute_entry(:project, ctx.project.id)
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

  defp assert_entry(source_type, source_id, expected \\ []) do
    entry = Repo.get_by!(Entry, source_type: source_type, source_id: source_id)
    Enum.each(expected, fn {field, value} -> assert Map.fetch!(entry, field) == value end)
    entry
  end

  defp refute_entry(source_type, source_id) do
    refute Repo.get_by(Entry, source_type: source_type, source_id: source_id)
  end
end
