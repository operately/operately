defmodule Operately.ResourceHubs.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Notifications.SubscribersLoader

  def get_document_subscribers(document_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    with_deleted = Keyword.get(opts, :with_deleted, false)

    document = load_resource(Operately.ResourceHubs.Document, document_id, with_deleted)

    SubscribersLoader.load_for_notifications(document, notification_people(document), ignore)
  end

  def get_file_subscribers(file_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    with_deleted = Keyword.get(opts, :with_deleted, false)

    file = load_resource(Operately.ResourceHubs.File, file_id, with_deleted)

    SubscribersLoader.load_for_notifications(file, notification_people(file), ignore)
  end

  def get_link_subscribers(link_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    with_deleted = Keyword.get(opts, :with_deleted, false)

    link = load_resource(Operately.ResourceHubs.Link, link_id, with_deleted)

    SubscribersLoader.load_for_notifications(link, notification_people(link), ignore)
  end

  defp load_resource(schema, id, with_deleted) do
    from(resource in schema,
      join: c in assoc(resource, :access_context),
      as: :context,
      preload: [:author, access_context: c, resource_hub: [space: :members, project: [contributors: :person]]],
      where: resource.id == ^id
    )
    |> Repo.one(with_deleted: with_deleted)
  end

  defp notification_people(resource) do
    hub = resource.resource_hub

    if hub.project do
      Enum.map(hub.project.contributors, & &1.person)
    else
      hub.space.members
    end
  end
end
