defmodule Operately.Repo.Migrations.UpdateCommentEntityTypeValueToMessage do
  use Ecto.Migration

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Messages.Message

  def up do
    from(c in Comment, where: c.entity_id in subquery(from(m in Message, select: m.id)))
    |> Repo.update_all(set: [entity_type: :message])
  end

  def down do
    from(c in Comment, where: c.entity_type == :message)
    |> Repo.update_all(set: [entity_type: :update])
  end
end
