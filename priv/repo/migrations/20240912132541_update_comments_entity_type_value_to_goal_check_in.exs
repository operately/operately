defmodule Operately.Repo.Migrations.UpdateCommentsEntityTypeValueToGoalCheckIn do
  use Ecto.Migration

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Goals.Update
  alias Operately.Updates.Comment

  def up do
    from(c in Comment, where: c.entity_id in subquery(from(u in Update, select: u.id)))
    |> Repo.update_all(set: [entity_type: :goal_update])
  end

  def down do
    from(c in Comment, where: c.entity_type == :goal_update)
    |> Repo.update_all(set: [entity_type: :update])
  end
end
