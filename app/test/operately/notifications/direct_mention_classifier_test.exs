defmodule Operately.Notifications.DirectMentionClassifierTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.CommentsFixtures
  import Operately.GoalsFixtures
  import Operately.MessagesFixtures
  import Operately.ProjectsFixtures

  alias Operately.Activities.Activity
  alias Operately.Notifications.DirectMentionClassifier
  alias Operately.Notifications.Notification
  alias Operately.Support.RichText

  setup do
    company = company_fixture()
    recipient = person_fixture_with_account(%{company_id: company.id, full_name: "Jane Doe"})
    author = person_fixture_with_account(%{company_id: company.id, full_name: "John Doe"})

    {:ok, company: company, recipient: recipient, author: author}
  end

  test "milestone_due_date_updating always returns false", ctx do
    notification =
      notification_struct(
        ctx.recipient,
        "milestone_due_date_updating",
        %{"milestone_id" => Ecto.UUID.generate()}
      )

    refute mentions_recipient?(notification)
  end

  test "milestone_description_updating skips malformed payloads without breaking classification", ctx do
    mention_map = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()

    mention_map_notification =
      notification_struct(
        ctx.recipient,
        "milestone_description_updating",
        %{"description" => mention_map}
      )

    invalid_notification =
      notification_struct(
        ctx.recipient,
        "milestone_description_updating",
        %{"description" => "<<invalid-json>>"}
      )

    result = DirectMentionClassifier.classify([mention_map_notification, invalid_notification])

    assert result[mention_map_notification.id]
    refute result[invalid_notification.id]
  end

  test "comment_added checks mentions from comment message", ctx do
    mention_message = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    plain_message = RichText.rich_text("No one mentioned here")

    mentioned_comment = comment_fixture(ctx.author, %{content: mention_message})
    plain_comment = comment_fixture(ctx.author, %{content: plain_message})

    mentioned_notification =
      notification_struct(
        ctx.recipient,
        "comment_added",
        %{"comment_id" => mentioned_comment.id}
      )

    non_mentioned_notification =
      notification_struct(
        ctx.recipient,
        "comment_added",
        %{"comment_id" => plain_comment.id}
      )

    assert mentions_recipient?(mentioned_notification)
    refute mentions_recipient?(non_mentioned_notification)
  end

  test "discussion_posting checks mentions from discussion body", ctx do
    space = Operately.Groups.get_group!(ctx.company.company_space_id)
    board = messages_board_fixture(space.id)

    mention_body = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    plain_body = RichText.rich_text("No one mentioned here")

    mentioned_discussion = message_fixture(ctx.author.id, board.id, [body: mention_body])
    plain_discussion = message_fixture(ctx.author.id, board.id, [body: plain_body])

    mentioned_notification =
      notification_struct(
        ctx.recipient,
        "discussion_posting",
        %{"discussion_id" => mentioned_discussion.id}
      )

    non_mentioned_notification =
      notification_struct(
        ctx.recipient,
        "discussion_posting",
        %{"discussion_id" => plain_discussion.id}
      )

    assert mentions_recipient?(mentioned_notification)
    refute mentions_recipient?(non_mentioned_notification)
  end

  test "goal_check_in checks mentions from goal update message", ctx do
    goal = goal_fixture(ctx.author, %{space_id: ctx.company.company_space_id})

    mention_message = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    plain_message = RichText.rich_text("No one mentioned here")

    mentioned_update = goal_update_fixture(ctx.author, goal, %{content: mention_message})
    plain_update = goal_update_fixture(ctx.author, goal, %{content: plain_message})

    mentioned_notification =
      notification_struct(
        ctx.recipient,
        "goal_check_in",
        %{"update_id" => mentioned_update.id}
      )

    non_mentioned_notification =
      notification_struct(
        ctx.recipient,
        "goal_check_in",
        %{"update_id" => plain_update.id}
      )

    assert mentions_recipient?(mentioned_notification)
    refute mentions_recipient?(non_mentioned_notification)
  end

  test "goal_created checks mentions from goal description", ctx do
    mention_description = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    plain_description = RichText.rich_text("No one mentioned here")

    mentioned_goal = goal_fixture(ctx.author, %{space_id: ctx.company.company_space_id, description: mention_description})
    plain_goal = goal_fixture(ctx.author, %{space_id: ctx.company.company_space_id, description: plain_description})

    mentioned_notification =
      notification_struct(
        ctx.recipient,
        "goal_created",
        %{"goal_id" => mentioned_goal.id}
      )

    non_mentioned_notification =
      notification_struct(
        ctx.recipient,
        "goal_created",
        %{"goal_id" => plain_goal.id}
      )

    assert mentions_recipient?(mentioned_notification)
    refute mentions_recipient?(non_mentioned_notification)
  end

  test "project_check_in_submitted checks mentions from check-in description", ctx do
    project = project_fixture(%{creator_id: ctx.author.id, group_id: ctx.company.company_space_id, company_id: ctx.company.id})

    mention_description = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    plain_description = RichText.rich_text("No one mentioned here")

    mentioned_check_in = check_in_fixture(%{project_id: project.id, author_id: ctx.author.id, description: mention_description})
    plain_check_in = check_in_fixture(%{project_id: project.id, author_id: ctx.author.id, description: plain_description})

    mentioned_notification =
      notification_struct(
        ctx.recipient,
        "project_check_in_submitted",
        %{"check_in_id" => mentioned_check_in.id}
      )

    non_mentioned_notification =
      notification_struct(
        ctx.recipient,
        "project_check_in_submitted",
        %{"check_in_id" => plain_check_in.id}
      )

    assert mentions_recipient?(mentioned_notification)
    refute mentions_recipient?(non_mentioned_notification)
  end

  test "goal_closing checks mentions from comment thread message via activity comment_thread_id", ctx do
    mention_message = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    plain_message = RichText.rich_text("No one mentioned here")

    mentioned_thread = comment_thread_fixture(%{parent_id: Ecto.UUID.generate(), message: mention_message})
    plain_thread = comment_thread_fixture(%{parent_id: Ecto.UUID.generate(), message: plain_message})

    mentioned_notification =
      notification_struct(
        ctx.recipient,
        "goal_closing",
        %{},
        %{comment_thread_id: mentioned_thread.id}
      )

    non_mentioned_notification =
      notification_struct(
        ctx.recipient,
        "goal_closing",
        %{},
        %{comment_thread_id: plain_thread.id}
      )

    assert mentions_recipient?(mentioned_notification)
    refute mentions_recipient?(non_mentioned_notification)
  end

  test "resource_hub_document_created checks mentions from document content", ctx do
    space = Operately.Groups.get_group!(ctx.company.company_space_id)
    resource_hub = Operately.ResourceHubsFixtures.resource_hub_fixture(ctx.author, space)

    mention_content = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    plain_content = RichText.rich_text("No one mentioned here")

    mentioned_document = Operately.ResourceHubsFixtures.document_fixture(resource_hub.id, ctx.author.id, %{content: mention_content})
    plain_document = Operately.ResourceHubsFixtures.document_fixture(resource_hub.id, ctx.author.id, %{content: plain_content})

    mentioned_notification =
      notification_struct(
        ctx.recipient,
        "resource_hub_document_created",
        %{"document_id" => mentioned_document.id}
      )

    non_mentioned_notification =
      notification_struct(
        ctx.recipient,
        "resource_hub_document_created",
        %{"document_id" => plain_document.id}
      )

    assert mentions_recipient?(mentioned_notification)
    refute mentions_recipient?(non_mentioned_notification)
  end

  test "project_milestone_commented only uses comment message when comment_action is none", ctx do
    mention_message = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    mentioned_comment = comment_fixture(ctx.author, %{content: mention_message})

    plain_comment_notification =
      notification_struct(
        ctx.recipient,
        "project_milestone_commented",
        %{"comment_id" => mentioned_comment.id, "comment_action" => "none"}
      )

    completion_notification =
      notification_struct(
        ctx.recipient,
        "project_milestone_commented",
        %{"comment_id" => mentioned_comment.id, "comment_action" => "complete"}
      )

    assert mentions_recipient?(plain_comment_notification)
    refute mentions_recipient?(completion_notification)
  end

  test "classify/1 raises when an action is not registered in any strategy list", ctx do
    notification =
      notification_struct(
        ctx.recipient,
        "totally_new_action",
        %{"project_id" => Ecto.UUID.generate()}
      )

    assert_raise RuntimeError, ~r/Activity not handled in direct mention classification/, fn ->
      DirectMentionClassifier.classify([notification])
    end
  end

  defp notification_struct(person, action, content, activity_fields \\ %{}) do
    %Notification{
      id: Ecto.UUID.generate(),
      person_id: person.id,
      activity: struct(Activity, Map.merge(%{action: action, content: content}, activity_fields))
    }
  end

  defp mentions_recipient?(notification) do
    DirectMentionClassifier.classify([notification])[notification.id]
  end
end
