defmodule Operately.Goals.Retrospective do
  # Ideally this would be a dedicated schema, but for historical reasons
  # we are using the activity table to store retrospectives.

  defstruct [
    :id,
    :title,
    :author,
    :comment_count,
    :inserted_at,
    :content
  ]

  import Ecto.Query, only: [from: 2]
  alias Operately.Repo

  def find(goal_id) do
    from(activity in Operately.Activities.Activity,
      join: thread in assoc(activity, :comment_thread),
      join: author in assoc(activity, :author),
      where: activity.action == "goal_closed",
      where: activity.content["goal_id"] == ^goal_id,
      order_by: [desc: activity.inserted_at],
      limit: 1,
      select: %__MODULE__{
        id: activity.id,
        title: thread.title,
        author: author,
        inserted_at: thread.inserted_at,
        content: thread.message,
        comment_count: fragment("SELECT COUNT(*) FROM comments WHERE entity_id = ? AND entity_type = 'comment_thread'", thread.id)
      }
    )
    |> Repo.all()
  end
end
