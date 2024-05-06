defmodule Operately.Activities.Notifications.CommentAdded do
  def dispatch(activity) do
    author_id = activity.author_id

    people_from_comment_thread = get_people_from_comment_thread(activity.content["comment_thread_id"])
    people_from_main_resource = get_people_from_main_resource(activity.content)
    people = people_from_comment_thread ++ people_from_main_resource

    people = 
      people
      |> List.flatten()
      |> Enum.reject(fn person -> person.id == author_id end)
      |> Enum.uniq_by(& &1.id)

    notifications = Enum.map(people, fn person ->
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)

    Operately.Notifications.bulk_create(notifications)
  end

  def get_people_from_main_resource(content) do
    case content do
      %{"goal_id" => goal_id} ->
        goal = Operately.Goals.get_goal!(goal_id)

        [Operately.People.get_person!(goal.champion_id), Operately.People.get_person!(goal.reviewer_id)]

      _ ->
        raise "Unsupported main resource"
    end
  end

  def get_people_from_comment_thread(comment_thread_id) do
    comment_thread = Operately.Comments.get_thread!(comment_thread_id)
    comments = Operately.Updates.list_comments(comment_thread.id, "comment_thread")

    people = get_people_from_rich_text(comment_thread.message)
    people_from_comments = Enum.map(comments, fn comment -> get_people_from_rich_text(comment.content) end)

    people ++ people_from_comments
  end

  def get_people_from_rich_text(rich_text) do
    rich_text
    |> ProsemirrorMentions.extract_ids()
    |> Enum.map(fn id -> Operately.People.get_person!(id) end)
  end
end
