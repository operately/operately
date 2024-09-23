defmodule Operately.Goals.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Notifications.SubscribersLoader

  def get_goal_update_subscribers(update_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])

    update =
      from(u in Operately.Goals.Update,
        join: g in assoc(u, :goal),
        join: c in assoc(g, :access_context),
        join: s in assoc(g, :group),
        join: p in assoc(s, :members),
        preload: [goal: {g, group: {s, members: p}}, access_context: c],
        where: u.id == ^update_id
      )
      |> Repo.one()

    SubscribersLoader.load(update, update.goal.group.members, ignore)
  end
end
