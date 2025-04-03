defmodule Operately.Messages.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Notifications.SubscribersLoader

  def get_subscribers(message_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])

    message =
      from(message in Operately.Messages.Message,
        join: c in assoc(message, :access_context), as: :context,
        join: s in assoc(message, :space),
        join: m in assoc(s, :members),
        preload: [space: {s, members: m}, access_context: c],
        where: message.id == ^message_id
      )
      |> Repo.one()

    SubscribersLoader.load_for_notifications(message, message.space.members, ignore)
  end
end
