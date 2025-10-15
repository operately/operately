defmodule Operately.Comments.CreateMilestoneCommentOperationTest do
  use Operately.DataCase, async: true

  import Ecto.Query, only: [from: 2]

  alias Operately.Comments.CreateMilestoneCommentOperation
  alias Operately.Notifications.SubscriptionList
  alias Operately.Support.Factory
  alias Operately.Support.Notifications
  alias Operately.Support.RichText
  alias Operately.Repo

  use Notifications

  @action "project_milestone_commented"

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.preload(:milestone, :subscription_list)
    |> Factory.add_project_contributor(:teammate, :project, :as_person)
  end

  describe "mentioned people" do
    test "mentions create subscriptions for milestone comments", ctx do
      content = RichText.rich_text(mentioned_people: [ctx.teammate]) |> Jason.decode!()

      assert fetch_mention_ids(ctx.milestone) == []

      {:ok, _comment} =
        CreateMilestoneCommentOperation.run(
          ctx.creator,
          ctx.milestone,
          "none",
          comment_attrs(ctx, content)
        )

      assert fetch_mention_ids(ctx.milestone) == [ctx.teammate.id]
    end

    test "mentions are ignored for status changes", ctx do
      content = RichText.rich_text(mentioned_people: [ctx.teammate]) |> Jason.decode!()

      {:ok, _comment} =
        CreateMilestoneCommentOperation.run(
          ctx.creator,
          ctx.milestone,
          "complete",
          comment_attrs(ctx, content)
        )

      assert fetch_mention_ids(ctx.milestone) == []
    end

    test "mentions are idempotent", ctx do
      content = RichText.rich_text(mentioned_people: [ctx.teammate]) |> Jason.decode!()

      {:ok, _comment} =
        CreateMilestoneCommentOperation.run(
          ctx.creator,
          ctx.milestone,
          "none",
          comment_attrs(ctx, content)
        )

      assert fetch_mention_ids(ctx.milestone) == [ctx.teammate.id]

      {:ok, _another_comment} =
        CreateMilestoneCommentOperation.run(
          ctx.creator,
          ctx.milestone,
          "none",
          comment_attrs(ctx, content)
        )

      assert fetch_mention_ids(ctx.milestone) == [ctx.teammate.id]
    end
  end

  describe "notifications" do
    test "mentioned subscribers and contributors receive notifications", ctx do
      ctx = Factory.add_company_member(ctx, :member)
      ctx = Factory.add_company_member(ctx, :another)

      content = RichText.rich_text(mentioned_people: [ctx.member]) |> Jason.decode!()

      {:ok, comment} =
        Oban.Testing.with_testing_mode(:manual, fn ->
          CreateMilestoneCommentOperation.run(
            ctx.creator,
            ctx.milestone,
            "none",
            comment_attrs(ctx, content)
          )
        end)

      activity = get_activity(comment)

      assert notifications_count(action: @action) == 0

      perform_job(activity.id)

      assert notifications_count(action: @action) == 2

      notifications = fetch_notifications(activity.id)

      assert Enum.any?(notifications, & &1.person_id == ctx.teammate.id)
      assert Enum.any?(notifications, & &1.person_id == ctx.member.id)
      refute Enum.any?(notifications, & &1.person_id == ctx.another.id)
    end
  end

  defp comment_attrs(ctx, content) do
    %{
      content: %{"message" => content},
      author_id: ctx.creator.id,
      entity_id: ctx.milestone.id,
      entity_type: :project_milestone
    }
  end

  defp fetch_mention_ids(milestone) do
    {:ok, list} =
      SubscriptionList.get(:system,
        id: milestone.subscription_list_id,
        opts: [preload: :subscriptions]
      )

    list.subscriptions
    |> Enum.filter(&(&1.type == :mentioned and not &1.canceled))
    |> Enum.map(& &1.person_id)
  end

  defp get_activity(comment) do
    from(a in Operately.Activities.Activity,
      where: a.action == @action and a.content["comment_id"] == ^comment.comment_id
    )
    |> Repo.one!()
  end
end
