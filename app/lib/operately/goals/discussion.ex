defmodule Operately.Goals.Discussion do
  # Ideally this would be a dedicated schema, but for historical reasons
  # we are using the activity table to store discussions.

  defstruct [
    :id,
    :title,
    :author,
    :comment_count,
    :inserted_at
  ]

  import Ecto.Query, only: [from: 2]
  alias Operately.Repo

  def list(goal_id) do
    from(t in Operately.Comments.CommentThread,
      join: a in Operately.Activities.Activity,
      on: a.comment_thread_id == t.id,
      where: a.content["goal_id"] == ^goal_id,
      where: a.action == "goal_discussion_creation",
      order_by: [desc: a.inserted_at],
      preload: [:activity]
    )
    |> Repo.all()
    |> Enum.map(fn t ->
      %__MODULE__{
        id: t.id,
        title: t.title,
        author: t.activity.author,
        inserted_at: t.inserted_at
      }
    end)
  end

  def preload_comment_count(threads) do
    thread_ids = Enum.map(threads, & &1.id)

    counts =
      from(c in Operately.Updates.Comment,
        where: c.entity_type == :comment_thread,
        where: c.entity_id in ^thread_ids,
        group_by: c.entity_id,
        select: {c.entity_id, count(c.id)}
      )
      |> Repo.all()
      |> Enum.into(%{})

    Enum.map(threads, fn thread ->
      comments_count = Map.get(counts, thread.id, 0)
      Map.put(thread, :comment_count, comments_count)
    end)
  end
end
