defmodule Operately.Comments.InlineThreadNotificationsTest do
  use Operately.DataCase
  alias Operately.Comments.InlineThreadNotifications
  alias Operately.Activities.Activity
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Operations.{InlineThreadReplying, InlineThreadResolving, InlineThreadReopening}
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, company_permissions: 0)
    |> Factory.add_space_member(:member, :space)
    |> Factory.add_space_member(:subscriber, :space)
    |> Factory.add_company_member(:outsider)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_document(:document, :hub, content: RichText.rich_text("Hello world"), subscriber_ids: [])
  end

  test "creation notifies document subscribers and mentions once, excluding the author and inaccessible people", ctx do
    document = Repo.preload(ctx.document, :subscription_list)
    {:ok, _} = Operately.Notifications.create_subscription(%{subscription_list_id: document.subscription_list.id, person_id: ctx.member.id, type: :invited})
    {:ok, _} = Operately.Notifications.create_subscription(%{subscription_list_id: document.subscription_list.id, person_id: ctx.subscriber.id, type: :invited})
    other = Factory.setup(%{})
    list_count = Repo.aggregate(SubscriptionList, :count)
    ctx = thread(ctx, mentions([ctx.creator, ctx.member, ctx.outsider, other.creator]))
    activity = activity(ctx.thread)

    assert Enum.sort(InlineThreadNotifications.recipients(activity)) == Enum.sort([ctx.member.id, ctx.subscriber.id])
    list = Repo.get!(SubscriptionList, ctx.document.subscription_list_id)
    assert Enum.sort(Repo.all(from s in Subscription, where: s.subscription_list_id == ^list.id, select: s.person_id)) == Enum.sort([ctx.creator.id, ctx.member.id, ctx.subscriber.id])
    assert Repo.aggregate(SubscriptionList, :count) == list_count

    assert Enum.sort(Repo.all(from n in Operately.Notifications.Notification, where: n.activity_id == ^activity.id, select: n.person_id)) == Enum.sort([ctx.member.id, ctx.subscriber.id])
  end

  test "replies notify document subscribers even when they have not joined the thread", ctx do
    {:ok, _} = Operately.Notifications.create_subscription(%{subscription_list_id: ctx.document.subscription_list_id, person_id: ctx.subscriber.id, type: :invited})
    ctx = thread(ctx, mentions([ctx.member]))
    {:ok, _} = InlineThreadReplying.run(ctx.member, ctx.thread, RichText.rich_text("A reply"))
    reply = activity(ctx.thread, ctx.member.id)
    assert Enum.sort(InlineThreadNotifications.recipients(reply)) == Enum.sort([ctx.creator.id, ctx.subscriber.id])

    {:ok, resolved} = InlineThreadResolving.run(ctx.creator, ctx.thread)
    {:ok, reopened} = InlineThreadReopening.run(ctx.creator, resolved)
    {:ok, _} = InlineThreadReplying.run(ctx.subscriber, reopened, RichText.rich_text("Reply after reopening"))
    assert Enum.sort(InlineThreadNotifications.recipients(activity(ctx.thread, ctx.subscriber.id))) == Enum.sort([ctx.creator.id, ctx.member.id])
  end

  test "canceled subscriptions stay canceled when mentioned again", ctx do
    ctx = thread(ctx, mentions([ctx.member]))
    list = Repo.get!(SubscriptionList, ctx.document.subscription_list_id)
    subscription = Repo.get_by!(Subscription, subscription_list_id: list.id, person_id: ctx.member.id)
    subscription |> Ecto.Changeset.change(canceled: true) |> Repo.update!()
    {:ok, replied} = InlineThreadReplying.run(ctx.creator, ctx.thread, mentions([ctx.member]))
    [reply] = Enum.reject(replied.messages, &(&1.id == hd(ctx.thread.messages).id))
    activity = Repo.one!(from a in Activity, where: fragment("?->>'comment_id'", a.content) == ^reply.id)
    assert InlineThreadNotifications.recipients(activity) == []
    assert Repo.reload!(subscription).canceled
  end

  test "document-wide subscriptions include space members and respect cancellations", ctx do
    list = Repo.get!(SubscriptionList, ctx.document.subscription_list_id)
    list |> Ecto.Changeset.change(send_to_everyone: true) |> Repo.update!()
    {:ok, _} = Operately.Notifications.create_subscription(%{subscription_list_id: list.id, person_id: ctx.member.id, type: :joined, canceled: true})

    ctx = thread(ctx, RichText.rich_text("Review"))
    assert InlineThreadNotifications.recipients(activity(ctx.thread)) == [ctx.subscriber.id]
    {:ok, _} = InlineThreadReplying.run(ctx.creator, ctx.thread, RichText.rich_text("Follow-up"))
    activities = Repo.all(from a in Activity, where: fragment("?->>'inline_thread_id'", a.content) == ^ctx.thread.id)
    assert Enum.all?(activities, &(InlineThreadNotifications.recipients(&1) == [ctx.subscriber.id]))
  end

  test "suspension and deleted documents exclude notification recipients", ctx do
    ctx = thread(ctx, mentions([ctx.member]))
    activity = activity(ctx.thread)
    assert InlineThreadNotifications.recipients(activity) == [ctx.member.id]
    ctx.member |> Ecto.Changeset.change(suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)) |> Repo.update!()
    assert InlineThreadNotifications.recipients(activity) == []
    ctx.member |> Ecto.Changeset.change(suspended_at: nil) |> Repo.update!()
    ctx.document |> Ecto.Changeset.change(deleted_at: DateTime.utc_now()) |> Repo.update!()
    assert InlineThreadNotifications.recipients(activity) == []
  end

  test "resolution records only actual transitions and does not enqueue notifications", ctx do
    ctx = thread(ctx, RichText.rich_text("Review"))
    jobs = Repo.aggregate(Oban.Job, :count)
    {:ok, _} = InlineThreadResolving.run(ctx.creator, ctx.thread)
    {:ok, _} = InlineThreadResolving.run(ctx.creator, ctx.thread)
    {:ok, _} = InlineThreadReopening.run(ctx.creator, ctx.thread)
    {:ok, _} = InlineThreadReopening.run(ctx.creator, ctx.thread)
    activities = Repo.all(from a in Activity, where: a.action == "resource_hub_document_inline_thread_resolution_changed", order_by: a.inserted_at)
    assert Enum.sort(Enum.map(activities, & &1.content["resolved"])) == [false, true]
    assert Repo.aggregate(Oban.Job, :count) == jobs
  end

  test "activities identify the thread and emails use the standard document comment path", ctx do
    ctx = thread(ctx, mentions([ctx.member]))
    raw = activity(ctx.thread)
    activity = raw |> Operately.Activities.cast_content() |> Operately.Activities.Preloader.preload()
    serialized = OperatelyWeb.Api.Serializer.serialize(activity.content, level: :essential)
    assert serialized.inline_thread_id == Operately.ShortUuid.encode!(ctx.thread.id)
    [message] = ctx.thread.messages
    expected = OperatelyWeb.Paths.document_path(ctx.company, ctx.document) <> "#" <> OperatelyWeb.Paths.comment_id(message)
    assert OperatelyWeb.Paths.document_path(ctx.company, ctx.document, message) == expected
    assert OperatelyEmail.Emails.ResourceHubDocumentCommentedEmail.buffered_item(ctx.member, raw).item_url == OperatelyWeb.Paths.to_url(expected)
  end

  for parent_type <- [:project, :goal] do
    @parent_type parent_type
    test "#{parent_type} documents use their owning access context", ctx do
      ctx = add_parent(ctx, @parent_type)

      context = Operately.ResourceHubs.Parent.get_access_context(ctx.parent)
      {:ok, _} = Operately.Access.bind_person(context, ctx.member.id, Operately.Access.Binding.comment_access())

      ctx =
        ctx
        |> Factory.add_resource_hub(:private_hub, :parent, :creator)
        |> Factory.add_document(:private_document, :private_hub, content: RichText.rich_text("Hello world"))
        |> Factory.add_inline_thread(:thread, :private_document, from: 1, to: 6, quote: "Hello", content: mentions([ctx.member, ctx.subscriber]))

      activity = activity(ctx.thread)
      assert activity.access_context_id == context.id
      assert InlineThreadNotifications.recipients(activity) == [ctx.member.id]
      Operately.Access.unbind_person(context, ctx.member.id)
      assert InlineThreadNotifications.recipients(activity) == []
    end
  end

  test "deleted messages and empty threads are excluded at notification dispatch", ctx do
    ctx = thread(ctx, mentions([ctx.member]))
    activity = activity(ctx.thread)
    [message] = ctx.thread.messages
    list = Repo.get!(SubscriptionList, ctx.document.subscription_list_id)
    assert {:ok, nil} = Operately.Operations.InlineThreadMessageDeleting.run(ctx.creator, ctx.thread, message)
    assert Repo.get(SubscriptionList, list.id)
    assert Repo.exists?(from s in Subscription, where: s.subscription_list_id == ^list.id and s.person_id == ^ctx.member.id)
    assert InlineThreadNotifications.recipients(activity) == []
  end

  test "rollback removes the thread, messages, subscriptions and activity together", ctx do
    tables = [Operately.Comments.InlineThread, Operately.Updates.Comment, SubscriptionList, Subscription, Activity, Oban.Job]
    before = Enum.map(tables, &Repo.aggregate(&1, :count))

    assert {:error, :forced_failure} =
             Repo.transaction(fn ->
               thread(ctx, mentions([ctx.member]))
               Repo.rollback(:forced_failure)
             end)

    assert Enum.map(tables, &Repo.aggregate(&1, :count)) == before
  end

  defp add_parent(ctx, :project), do: Factory.add_project(ctx, :parent, :space, company_access_level: 0, space_access_level: 0)
  defp add_parent(ctx, :goal), do: Factory.add_goal(ctx, :parent, :space, company_access: 0, space_access: 0)

  defp thread(ctx, content), do: Factory.add_inline_thread(ctx, :thread, :document, from: 1, to: 6, quote: "Hello", content: content)
  defp mentions(people), do: RichText.rich_text(mentioned_people: people) |> Jason.decode!()

  defp activity(thread, author_id \\ nil) do
    query =
      from a in Activity,
        where: a.action == "resource_hub_document_commented" and fragment("?->>'inline_thread_id'", a.content) == ^thread.id

    query = if author_id, do: where(query, [a], a.author_id == ^author_id), else: query
    Repo.one!(query)
  end
end
