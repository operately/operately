defmodule Operately.Notifications.DirectMentionClassifierTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.CommentsFixtures

  alias Operately.Activities.Activity
  alias Operately.Notifications.DirectMentionClassifier
  alias Operately.Notifications.Notification
  alias Operately.Support.RichText

  setup do
    company = company_fixture()
    recipient = person_fixture_with_account(%{company_id: company.id, full_name: "Jane Doe"})
    author = person_fixture_with_account(%{company_id: company.id, full_name: "John Doe"})

    {:ok, recipient: recipient, author: author}
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

    mentioned_comment = comment_fixture(ctx.author, %{content: %{"message" => mention_message}})
    plain_comment = comment_fixture(ctx.author, %{content: %{"message" => plain_message}})

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

  test "project_milestone_commented only uses comment message when comment_action is none", ctx do
    mention_message = RichText.rich_text(mentioned_people: [ctx.recipient]) |> Jason.decode!()
    mentioned_comment = comment_fixture(ctx.author, %{content: %{"message" => mention_message}})

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

  defp notification_struct(person, action, content) do
    %Notification{
      id: Ecto.UUID.generate(),
      person_id: person.id,
      activity: %Activity{action: action, content: content}
    }
  end

  defp mentions_recipient?(notification) do
    DirectMentionClassifier.classify([notification])[notification.id]
  end
end
