defmodule Operately.Data.Change104AcknowledgeExistingRetrospectives do
  @moduledoc """
  Marks all existing project and goal retrospectives as acknowledged by their
  author at creation time, so historical closings do not appear as pending
  review assignments after retrospective acknowledgement shipped.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Activity, CommentThread, Retrospective}

  def run do
    acknowledge_project_retrospectives()
    acknowledge_goal_retrospectives()
  end

  defp acknowledge_project_retrospectives do
    from(r in Retrospective,
      where: is_nil(r.acknowledged_by_id),
      where: not is_nil(r.author_id),
      update: [
        set: [
          acknowledged_by_id: fragment("author_id"),
          acknowledged_at: fragment("inserted_at")
        ]
      ]
    )
    |> Repo.update_all([])
  end

  defp acknowledge_goal_retrospectives do
    from(t in CommentThread,
      join: a in Activity,
      on: a.comment_thread_id == t.id,
      where: a.action == "goal_closing",
      where: is_nil(t.acknowledged_by_id),
      select: %{
        id: t.id,
        thread_author_id: t.author_id,
        activity_author_id: a.author_id,
        inserted_at: t.inserted_at
      }
    )
    |> Repo.all()
    |> Enum.each(&acknowledge_goal_retrospective/1)
  end

  defp acknowledge_goal_retrospective(%{id: id, thread_author_id: thread_author_id, activity_author_id: activity_author_id, inserted_at: inserted_at}) do
    case thread_author_id || activity_author_id do
      nil ->
        :ok

      owner_id ->
        from(t in CommentThread, where: t.id == ^id and is_nil(t.acknowledged_by_id))
        |> Repo.update_all(set: [acknowledged_by_id: owner_id, acknowledged_at: as_utc_datetime(inserted_at)])
    end
  end

  defp as_utc_datetime(%DateTime{} = datetime), do: DateTime.truncate(datetime, :second)

  defp as_utc_datetime(%NaiveDateTime{} = datetime) do
    datetime
    |> DateTime.from_naive!("Etc/UTC")
    |> DateTime.truncate(:second)
  end

  defmodule Retrospective do
    use Operately.Schema

    schema "project_retrospectives" do
      field :author_id, :binary_id
      field :acknowledged_by_id, :binary_id
      field :acknowledged_at, :utc_datetime

      timestamps()
    end
  end

  defmodule CommentThread do
    use Operately.Schema

    schema "comment_threads" do
      field :author_id, :binary_id
      field :acknowledged_by_id, :binary_id
      field :acknowledged_at, :utc_datetime

      timestamps()
    end
  end

  defmodule Activity do
    use Operately.Schema

    schema "activities" do
      field :action, :string
      field :author_id, :binary_id
      field :comment_thread_id, :binary_id
      field :content, :map

      timestamps()
    end
  end
end
