defmodule OperatelyWeb.Api.Queries.GetComments do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 3]

  alias Operately.Updates.{Update, Comment}
  alias Operately.Groups.Group
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

    comments = load(id, type, me(conn), company(conn))

    {:ok, %{comments: Serializer.serialize(comments, level: :full)}}
  end

  defp load(id, :project_check_in, person, _) do
    from(c in Comment,
      join: check_in in CheckIn, on: c.entity_id == check_in.id,
      join: p in assoc(check_in, :project), as: :project,
      where: c.entity_id == ^id and c.entity_type == :project_check_in
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :project)
    |> Repo.all()
  end

  defp load(id, :goal_update, person, _) do
    from(c in Comment,
      join: u in Update, on: c.entity_id == u.id,
      join: g in Goal, on: u.updatable_id == g.id, as: :goal,
      where: c.entity_id == ^id and c.entity_type == :update
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :goal)
    |> Repo.all()
  end

  defp load(id, :discussion, person, company) do
    group_id = from(g in Group,
        join: u in Update, on: u.updatable_id == g.id,
        where: u.id == ^id,
        select: g.id
      )
      |> Repo.one!()

    query = from(c in Comment,
        join: u in Update, on: c.entity_id == u.id,
        join: g in Group, on: u.updatable_id == g.id, as: :group,
        where: c.entity_id == ^id and c.entity_type == :update
      )
      |> preload_resources()

    if group_id == company.company_space_id do
      query
      |> filter_by_view_access(person.id, [
        join_parent: :company,
        named_binding: :group,
      ])
      |> Repo.all()
    else
      query
      |> filter_by_view_access(person.id, named_binding: :group)
      |> Repo.all()
    end
  end

  defp load(id, :comment_thread, person, _) do
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
