defmodule OperatelyWeb.Api.Queries.GetComments do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 3]

  alias Operately.Updates.{Update, Comment}
  alias Operately.Goals.Goal
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

    comments = load(me(conn), id, type)

    {:ok, %{comments: Serializer.serialize(comments, level: :full)}}
  end

  defp load(person, id, :project_check_in) do
    from(c in Comment,
      join: check_in in CheckIn, on: c.entity_id == check_in.id,
      join: p in assoc(check_in, :project), as: :project,
      where: c.entity_id == ^id and c.entity_type == :project_check_in,
      order_by: [asc: c.inserted_at]
    )
    |> filter_by_view_access(person.id, named_binding: :project)
    |> Repo.all()
  end

  defp load(person, id, :update) do
    from(c in Comment,
      join: u in Update, on: c.entity_id == u.id,
      join: g in Goal, on: u.updatable_id == g.id, as: :goal,
      where: c.entity_id == ^id and c.entity_type == :update,
      preload: [:author, reactions: :person],
      order_by: [asc: c.inserted_at]
    )
    |> filter_by_view_access(person.id, named_binding: :goal)
    |> Repo.all()
  end

  defp load(person, id, :comment_thread) do
    from(c in Comment,
      join: t in CommentThread, on: c.entity_id == t.id,
      join: a in Activity, on: t.parent_id == a.id, as: :activity,
      where: c.entity_id == ^id and c.entity_type == :comment_thread,
      preload: [:author, reactions: :person],
      order_by: [asc: c.inserted_at]
    )
    |> filter_by_view_access(person.id, named_binding: :activity)
    |> Repo.all()
  end
end
