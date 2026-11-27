defmodule Operately.Search.DiscussionQuery do
  import Ecto.Query
  alias Operately.Access.Context
  alias Operately.Groups.Group
  alias Operately.Messages.Message

  def with_owner do
    from(m in Message,
      left_join: b in assoc(m, :messages_board), as: :board,
      left_join: p in assoc(m, :project), as: :project,
      join: s in Group, on: s.id == coalesce(b.space_id, p.group_id), as: :space,
      join: context in Context, on: context.group_id == b.space_id or context.project_id == p.id, as: :context,
      where: is_nil(p.deleted_at) and is_nil(s.deleted_at)
    )
  end
end
