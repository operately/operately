defmodule Operately.Operations.DiscussionPublishingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Ecto.Adapters.SQL.Sandbox
  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.AsyncPublishing.Worker
  alias Operately.Messages.Message
  alias Operately.Operations.{DiscussionEditing, DiscussionPosting, DiscussionPublishing, MessageArchiving}
  alias Operately.Support.RichText

  test "private project and goal drafts notify eligible subscribers only upon publication" do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:space_member, :space)
      |> Factory.add_space_member(:reviewer, :space)
      |> Factory.add_project(:project, :space, champion: :creator, reviewer: :reviewer, space_access_level: Binding.no_access(), company_access_level: Binding.no_access())
      |> Factory.add_goal(:goal, :space, reviewer: :reviewer, space_access: Binding.no_access(), company_access: Binding.no_access())

    Oban.Testing.with_testing_mode(:manual, fn ->
      for {owner, action} <- [{ctx.project, "project_discussion_submitted"}, {ctx.goal, "goal_discussion_creation"}] do
        attrs = %{title: "Draft", content: RichText.rich_text("Body"), post_as_draft: true, send_to_everyone: true, subscriber_ids: [ctx.space_member.id]}
        assert {:ok, draft} = DiscussionPosting.run(ctx.creator, owner, attrs)
        refute Repo.exists?(activity_query(draft))
        assert {:error, :not_found} = DiscussionEditing.run(ctx.reviewer, draft, %{title: "Changed"})
        assert {:error, :not_found} = DiscussionPublishing.run(ctx.reviewer, draft)
        assert {:error, :not_found} = MessageArchiving.run(ctx.reviewer, draft)

        assert {:ok, published} = DiscussionEditing.run(ctx.creator, draft, %{state: :published, title: "Final"})
        assert published.state == :published
        assert published.published_at
        [activity] = Repo.all(activity_query(draft))
        assert activity.action == action
        assert activity.access_context_id == Repo.preload(owner, :access_context).access_context.id
        assert activity.comment_thread_id == nil

        assert [] == fetch_notifications(activity.id)
        dispatch_activity_notifications(activity.id)
        assert Enum.map(fetch_notifications(activity.id), & &1.person_id) == [ctx.reviewer.id]

        assert {:ok, edited} = DiscussionEditing.run(ctx.reviewer, published, %{title: "Edited"})
        assert edited.title == "Edited"

        if owner == ctx.goal do
          assert Repo.exists?(from a in Activity, where: a.action == "goal_discussion_editing" and a.content["activity_id"] == ^activity.id)
        end
      end
    end)
  end

  test "contradictory scheduling inputs fail and a discarded schedule cannot publish" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    time = Operately.Time.days_from_now(1)
    attrs = %{title: "Scheduled", content: RichText.rich_text("Body"), subscriber_ids: [], scheduled_at: time}
    assert {:error, :invalid_schedule} = DiscussionPosting.run(ctx.creator, ctx.project, Map.put(attrs, :post_as_draft, true))
    assert {:ok, message} = DiscussionPosting.run(ctx.creator, ctx.project, attrs)
    assert {:error, :invalid_schedule} = DiscussionEditing.run(ctx.creator, message, %{state: :published, scheduled_at: time})
    assert {:ok, draft} = DiscussionEditing.run(ctx.creator, message, %{state: :draft})
    assert draft.scheduled_at == nil
    assert {:error, :invalid_schedule} = DiscussionEditing.run(ctx.creator, draft, %{state: :scheduled})
    assert :ok = Worker.perform(%Oban.Job{args: %{"type" => "message", "id" => draft.id}})
    assert Repo.reload!(draft).state == :draft

    assert {:ok, scheduled} = DiscussionEditing.run(ctx.creator, draft, %{scheduled_at: time})
    jobs = from j in Oban.Job, where: j.worker == "Operately.AsyncPublishing.Worker" and j.args["id"] == ^scheduled.id
    assert Repo.exists?(jobs)
    assert {:ok, _} = MessageArchiving.run(ctx.creator, scheduled)
    refute Repo.exists?(jobs)
    assert :ok = Worker.perform(%Oban.Job{args: %{"type" => "message", "id" => scheduled.id}})
    refute Repo.get(Message, scheduled.id)
    refute Repo.exists?(activity_query(scheduled))
  end

  test "a stale publish is rejected while a content edit still uses the current permissions" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    attrs = %{post_as_draft: true, title: "Draft", content: RichText.rich_text("Body"), subscriber_ids: []}
    assert {:ok, draft} = DiscussionPosting.run(ctx.creator, ctx.project, attrs)
    assert {:ok, _} = DiscussionPublishing.run(ctx.creator, draft)
    assert {:error, :forbidden} = DiscussionEditing.run(ctx.creator, draft, %{state: :published})
    assert {:ok, %{state: :published, title: "Renamed"}} = DiscussionEditing.run(ctx.creator, draft, %{title: "Renamed"})
  end

  test "a project author who loses edit access cannot publish a saved draft" do
    ctx =
      Factory.setup(%{})
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:author, :space)
      |> Factory.add_project(:project, :space, company_access_level: Binding.no_access(), space_access_level: Binding.edit_access())

    attrs = %{post_as_draft: true, title: "Draft", content: RichText.rich_text("Body"), subscriber_ids: []}
    assert {:ok, draft} = DiscussionPosting.run(ctx.author, ctx.project, attrs)
    Factory.edit_project_space_members_access(ctx, :project, :view_access)
    assert {:ok, _} = Message.get(ctx.author, id: draft.id)
    assert {:error, :forbidden} = DiscussionPublishing.run(ctx.author, draft)
    assert {:error, :forbidden} = DiscussionEditing.run(ctx.author, draft, %{state: :published})

    Factory.edit_project_space_members_access(ctx, :project, :no_access)
    assert {:error, :not_found} = DiscussionPublishing.run(ctx.author, draft)
    assert Repo.reload!(draft).state == :draft
  end

  test "the worker respects the precise time on a replacement job" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
    time = Operately.Time.days_from_now(1)
    exact_time = %{time | microsecond: {750_000, 6}}
    attrs = %{scheduled_at: time, title: "Scheduled", content: RichText.rich_text("Body"), subscriber_ids: []}
    assert {:ok, original} = DiscussionPosting.run(ctx.creator, ctx.goal, attrs)
    assert {:ok, message} = DiscussionEditing.run(ctx.creator, original, %{scheduled_at: exact_time})
    assert message.scheduled_at == time

    [job] = Repo.all(from j in Oban.Job, where: j.worker == "Operately.AsyncPublishing.Worker" and j.args["id"] == ^message.id)
    assert job.scheduled_at == exact_time

    # Simulate a due message with its replacement job still pending.
    past = Operately.Time.days_from_now(-1)
    Repo.update!(change(message, scheduled_at: past))
    assert {:ok, :skipped} = DiscussionPublishing.run(:system, message.id)
    Repo.update!(change(job, scheduled_at: DateTime.add(exact_time, -2, :day)))
    assert {:ok, %{state: :published}} = DiscussionPublishing.run(:system, message.id)
  end

  test "a scheduled space discussion still publishes when the executing job runs slightly ahead of local clock" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space)
    time = DateTime.add(Operately.Time.utc_datetime_now(), 5, :second)
    attrs = %{scheduled_at: time, title: "Scheduled", content: RichText.rich_text("Body"), subscriber_ids: []}

    assert {:ok, message} = DiscussionPosting.run(ctx.creator, ctx.space, attrs)

    [job] = Repo.all(from j in Oban.Job, where: j.worker == "Operately.AsyncPublishing.Worker" and j.args["id"] == ^message.id)
    Repo.update!(change(job, state: "executing"))

    assert :ok = Worker.perform(job)
    assert Repo.reload!(message).state == :published
    assert Repo.exists?(activity_query(message))
  end

  test "loading potential subscribers requires preloaded associations instead of silently preloading" do
    ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_messages_board(:board, :space) |> Factory.add_space_member(:member, :space)
    message = Operately.MessagesFixtures.message_fixture(ctx.creator.id, ctx.board.id)

    assert_raise FunctionClauseError, fn ->
      Message.set_potential_subscribers(message)
    end

    {:ok, loaded} = Message.get(ctx.creator, id: message.id, opts: [getter_profile: :space_discussion, preload: [:access_context, space: :members]])
    result = Message.set_potential_subscribers(loaded)
    assert Enum.any?(result.potential_subscribers, &(&1.person.id == ctx.member.id))
  end

  test "a queued worker racing manual publication creates one activity and notifies the subscriber once" do
    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_messages_board(:board, :space) |> Factory.add_space_member(:subscriber, :space)
      message = Operately.MessagesFixtures.message_fixture(ctx.creator.id, ctx.board.id, state: :scheduled, scheduled_at: Operately.Time.days_from_now(-1), person_ids: [ctx.subscriber.id])
      parent = self()

      try do
        manual =
          Task.async(fn ->
            Sandbox.unboxed_run(Repo, fn ->
              Oban.Testing.with_testing_mode(:inline, fn ->
                Repo.transaction(fn ->
                  assert {:ok, _} = DiscussionPublishing.run(ctx.creator, message)
                  send(parent, :published)

                  receive do
                    :commit -> :ok
                  after
                    5_000 -> Repo.rollback(:timeout)
                  end
                end)
              end)
            end)
          end)

        assert_receive :published, 5_000

        worker =
          Task.async(fn ->
            Sandbox.unboxed_run(Repo, fn ->
              send(parent, :worker_started)
              Worker.perform(%Oban.Job{args: %{"type" => "message", "id" => message.id}})
            end)
          end)

        assert_receive :worker_started, 5_000
        assert Task.yield(worker, 50) == nil
        send(manual.pid, :commit)
        assert {:ok, :ok} = Task.await(manual)
        assert :ok = Task.await(worker)

        [activity] = Repo.all(activity_query(message))
        assert Enum.map(fetch_notifications(activity.id), & &1.person_id) == [ctx.subscriber.id]
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
        Repo.delete!(Repo.get!(Operately.People.Account, ctx.subscriber.account_id))
      end
    end)
  end

  defp activity_query(message), do: from(a in Activity, where: a.content["discussion_id"] == ^message.id)
end
