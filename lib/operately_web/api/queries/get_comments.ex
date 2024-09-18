defmodule OperatelyWeb.Api.Queries.GetComments do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 3]

  alias Operately.Updates.Comment
  alias Operately.Projects.CheckIn
  alias Operately.Comments.CommentThread
  alias Operately.Activities.Activity

  inputs do
    field :entity_id, :string
    field :entity_type, :string
  end

  outputs do
    field :comments, list_of(:comment)
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.entity_id)
    type = String.to_existing_atom(inputs.entity_type)

    comments = load(id, type, me(conn))

    {:ok, %{comments: Serializer.serialize(comments, level: :full)}}
  end

  defp load(id, :project_check_in, person) do
    from(c in Comment,
      join: check_in in CheckIn, on: c.entity_id == check_in.id,
      join: p in assoc(check_in, :project), as: :project,
      where: c.entity_id == ^id and c.entity_type == :project_check_in
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :project)
    |> Repo.all()
  end

  defp load(id, :goal_update, person) do
    from(c in Comment,
      join: u in Operately.Goals.Update, on: c.entity_id == u.id, as: :update,
      where: u.id == ^id
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :update)
    |> Repo.all()
  end

  defp load(id, :message, person) do
    from(c in Comment,
      join: m in Operately.Messages.Message, on: c.entity_id == m.id, as: :message,
      where: m.id == ^id
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :message)
    |> Repo.all()
  end

  defp load(id, :comment_thread, person) do
    from(c in Comment,
      join: t in CommentThread, on: c.entity_id == t.id,
      join: a in Activity, on: t.parent_id == a.id, as: :activity,
      where: c.entity_id == ^id and c.entity_type == :comment_thread
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :activity)
    |> Repo.all()
  end

  defp preload_resources(query) do
    from(c in query,
      preload: [:author, reactions: :person],
      order_by: [asc: c.inserted_at]
    )
  end
end
