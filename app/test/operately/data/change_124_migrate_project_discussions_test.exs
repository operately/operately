defmodule Operately.Data.Change124MigrateProjectDiscussionsTest do
  use Operately.DataCase

  alias Operately.Activities.Activity
  alias Operately.Comments.CommentThread
  alias Operately.Data.Change124MigrateProjectDiscussions, as: Migration
  alias Operately.Messages.Message
  alias Operately.Notifications.{Notification, Subscription, SubscriptionList}
  alias Operately.Updates.{Comment, Reaction}
  alias Operately.Support.RichText

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
  end

  test "moves published threads, including those without activities, exactly once", ctx do
    thread = legacy_thread(ctx)
    template_thread = legacy_thread(ctx)
    context = Repo.preload(ctx.project, :access_context).access_context
    creation = Operately.ActivitiesFixtures.activity_fixture(
      action: "project_discussion_submitted", author_id: ctx.creator.id, access_context_id: context.id,
      comment_thread_id: thread.id, content: %{project_id: ctx.project.id, discussion_id: thread.id, company_id: ctx.company.id, space_id: ctx.space.id, title: thread.title}
    )
    notification = Operately.NotificationsFixtures.notification_fixture(activity_id: creation.id, person_id: ctx.creator.id)
    subscription = Repo.insert!(Subscription.changeset(%{person_id: ctx.creator.id, subscription_list_id: thread.subscription_list_id, type: :invited, canceled: true}))
    comment = Repo.insert!(Comment.changeset(%{author_id: ctx.creator.id, entity_type: :comment_thread, entity_id: thread.id, content: RichText.rich_text("Reply")}))
    direct = Repo.insert!(Reaction.changeset(%{person_id: ctx.creator.id, entity_type: :comment_thread, entity_id: thread.id, emoji: "👍"}))
    nested = Repo.insert!(Reaction.changeset(%{person_id: ctx.creator.id, entity_type: :comment, entity_id: comment.id, emoji: "👍"}))
    reply = Operately.ActivitiesFixtures.activity_fixture(
      action: "comment_added", author_id: ctx.creator.id, access_context_id: context.id,
      content: %{project_id: ctx.project.id, activity_id: creation.id, comment_thread_id: thread.id, comment_id: comment.id}
    )

    activity_count = Repo.aggregate(Activity, :count)
    assert {:ok, :ok} = Migration.run()
    assert {:ok, :ok} = Migration.run()

    jobs = Repo.all(from j in Oban.Job, where: j.worker == "Operately.Search.IndexUpdates.Worker" and j.args["source_type"] == "discussion")
    assert Enum.flat_map(jobs, & &1.args["source_ids"]) |> Enum.sort() == Enum.sort([thread.id, template_thread.id])

    message = Repo.get!(Message, thread.id)
    assert {message.project_id, message.author_id, message.title, message.body} == {ctx.project.id, thread.author_id, thread.title, thread.message}
    assert message.state == :published
    assert message.inserted_at == thread.inserted_at
    assert message.updated_at == thread.updated_at
    assert DateTime.to_naive(message.published_at) == creation.inserted_at
    assert DateTime.to_naive(Repo.get!(Message, template_thread.id).published_at) == template_thread.inserted_at
    assert message.subscription_list_id == thread.subscription_list_id
    assert %{parent_type: :message, send_to_everyone: true} = Repo.get!(SubscriptionList, message.subscription_list_id)
    assert Repo.reload!(subscription) == subscription
    assert Repo.reload!(comment).entity_type == :message
    assert Repo.reload!(direct).entity_type == :message
    assert Repo.reload!(nested) == nested
    assert Repo.reload!(creation).comment_thread_id == nil
    assert Repo.reload!(reply).content["discussion_id"] == thread.id
    assert Repo.get!(Notification, notification.id) == notification
    assert Repo.aggregate(Activity, :count) == activity_count
    refute Repo.get(CommentThread, thread.id)
    refute Repo.get(CommentThread, template_thread.id)
    assert OperatelyEmail.Emails.CommentAddedEmail.get_link(ctx.company, Operately.Activities.get_activity!(reply.id), comment) ==
             OperatelyWeb.Paths.to_url(OperatelyWeb.Paths.project_discussion_path(ctx.company, message, comment))
  end

  test "leaves threads from a deleted space untouched while migrating surviving projects", ctx do
    orphan = legacy_thread(ctx)
    assert {:ok, _} = Operately.Operations.SpaceDeleting.run(Repo.preload(ctx.space, :company))
    refute Repo.get(Operately.Projects.Project, ctx.project.id)
    assert Repo.get!(CommentThread, orphan.id)

    ctx = ctx |> Factory.add_space(:surviving_space) |> Factory.add_project(:project, :surviving_space)
    surviving = legacy_thread(ctx)

    assert {:ok, :ok} = Migration.run()
    assert Repo.get!(Message, surviving.id).project_id == ctx.project.id
    assert Repo.reload!(orphan).subscription_list_id == orphan.subscription_list_id
    refute Repo.get(Message, orphan.id)
  end

  test "preserves a thread and its activity if the foreign key points at an unrelated event", ctx do
    thread = legacy_thread(ctx)
    activity = Operately.ActivitiesFixtures.activity_fixture(action: "project_pausing", author_id: ctx.creator.id, comment_thread_id: thread.id)

    assert_raise RuntimeError, ~r/unexpected activity linked/, fn -> Migration.run() end
    assert Repo.reload!(activity).comment_thread_id == thread.id
    assert Repo.get!(CommentThread, thread.id)
    refute Repo.get(Message, thread.id)
  end

  test "rejects an existing message UUID without removing the source", ctx do
    ctx = Factory.add_project_discussion(ctx, :existing, :project)
    thread = legacy_thread(ctx, ctx.existing.id)
    assert_raise RuntimeError, ~r/conflicting message/, fn -> Migration.run() end
    assert Repo.get!(CommentThread, thread.id).message == thread.message
  end

  defp legacy_thread(ctx, id \\ Ecto.UUID.generate()) do
    list = Repo.insert!(SubscriptionList.changeset(%{parent_id: id, parent_type: :comment_thread, send_to_everyone: true}))
    %CommentThread{id: id, inserted_at: ~N[2025-05-04 11:00:00], updated_at: ~N[2025-05-05 12:00:00]}
    |> CommentThread.changeset(%{author_id: ctx.creator.id, parent_type: :project, parent_id: ctx.project.id,
      subscription_list_id: list.id, has_title: true, title: "Legacy discussion", message: RichText.rich_text("Original")})
    |> Repo.insert!()
  end
end
