defmodule Operately.Goals.Notifications do
  import Ecto.Query, only: [from: 2, where: 3]

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

    SubscribersLoader.load_for_notifications(update, update.goal.group.members, ignore)
  end

  def get_goal_thread_subscribers(activity_id, goal_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    comment_thread_id = Keyword.get(opts, :comment_thread_id)

    thread =
      Repo.one(
        from(t in Operately.Comments.CommentThread, join: a in assoc(t, :activity), as: :activity, join: c in assoc(t, :access_context), preload: [access_context: c], select: t)
        |> then(fn query ->
          if comment_thread_id do
            where(query, [t], t.id == ^comment_thread_id)
          else
            where(query, [activity: a], a.id == ^activity_id)
          end
        end)
      )

    goal =
      Repo.one(
        from(g in Operately.Goals.Goal,
          join: s in assoc(g, :group),
          join: p in assoc(s, :members),
          preload: [group: {s, members: p}],
          where: g.id == ^goal_id
        )
      )

    SubscribersLoader.load_for_notifications(thread, goal.group.members, ignore)
  end
end
