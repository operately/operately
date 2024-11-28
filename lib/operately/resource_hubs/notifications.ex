defmodule Operately.ResourceHubs.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Notifications.SubscribersLoader

  def get_document_subscribers(document_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    with_deleted = Keyword.get(opts, :with_deleted, false)

    document =
      from(document in Operately.ResourceHubs.Document,
        join: c in assoc(document, :access_context), as: :context,
        join: h in assoc(document, :resource_hub),
        join: s in assoc(h, :space),
        join: m in assoc(s, :members),
        preload: [resource_hub: {h, space: {s, members: m}}, access_context: c],
        where: document.id == ^document_id
      )
      |> Repo.one(with_deleted: with_deleted)

    SubscribersLoader.load_for_notifications(document, document.resource_hub.space.members, ignore)
  end
end
