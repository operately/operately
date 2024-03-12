defmodule Operately.Activities.Notifications.DiscussionCommentSubmitted do
  def dispatch(activity) do
    author_id = activity.author_id
    space_id = activity.content["space_id"]
    discussion_id = activity.content["discussion_id"]

    space = Operately.Groups.get_group!(space_id)
    members = Operately.Groups.list_members(space)

    discussion = Operately.Updates.get_update!(discussion_id)
    discussion_author = Operately.People.get_person!(discussion.author_id)

    comments = Operately.Updates.list_comments(discussion_id)
    comment_authors = Enum.map(comments, fn comment ->
      comment_author = Operately.People.get_person!(comment.author_id)
      comment_author
    end)

    comment = Operately.Updates.get_comment!(activity.content["comment_id"])

    mentioned = 
      comment.content["message"]
      |> ProsemirrorMentions.extract_ids()
      |> Enum.map(fn id -> Operately.People.get_person!(id) end)

    people = members ++ [discussion_author] ++ comment_authors ++ mentioned
    people = Enum.uniq(people)
    people = Enum.filter(people, fn person ->
      person.id != author_id
    end)

    notifications = Enum.map(people, fn person ->
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)

    Operately.Notifications.bulk_create(notifications)
  end
end
