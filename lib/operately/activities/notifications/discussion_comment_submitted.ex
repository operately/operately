defmodule Operately.Activities.Notifications.DiscussionCommentSubmitted do
  alias Operately.Messages.Message

  def dispatch(activity) do
    author_id = activity.author_id
    space_id = activity.content["space_id"]
    message_id = activity.content["discussion_id"]

    space = Operately.Groups.get_group!(space_id)
    members = Operately.Groups.list_members(space)

    {:ok, %{author: message_author}} = Message.get(:system, id: message_id, opts: [
      preload: :author,
    ])

    comments = Operately.Updates.list_comments(message_id)
    comment_authors = Enum.map(comments, fn comment ->
      Operately.People.get_person!(comment.author_id)
    end)

    comment = Operately.Updates.get_comment!(activity.content["comment_id"])
    mentioned = Operately.RichContent.lookup_mentioned_people(comment.content["message"])

    members ++ [message_author] ++ comment_authors ++ mentioned
    |> Enum.uniq_by(& &1.id)
    |> Enum.filter(fn person -> person.id != author_id end)
    |> Enum.map(fn person ->
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
