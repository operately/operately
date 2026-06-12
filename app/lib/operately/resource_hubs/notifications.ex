defmodule Operately.ResourceHubs.Notifications do
  alias Operately.Notifications.SubscribersLoader
  alias Operately.ResourceHubs.{Document, File, Link, Parent}

  def get_document_subscribers(document_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    with_deleted = Keyword.get(opts, :with_deleted, false)

    document =
      Document.get!(:system, id: document_id, opts: [preload: [:node, :resource_hub], with_deleted: with_deleted])
      |> Parent.prepare_for_notifications()

    SubscribersLoader.load_for_notifications(document, Parent.notification_people(document.resource_hub), ignore)
  end

  def get_file_subscribers(file_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    with_deleted = Keyword.get(opts, :with_deleted, false)

    file =
      File.get!(:system, id: file_id, opts: [preload: [:node, :resource_hub], with_deleted: with_deleted])
      |> Parent.prepare_for_notifications()

    SubscribersLoader.load_for_notifications(file, Parent.notification_people(file.resource_hub), ignore)
  end

  def get_link_subscribers(link_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    with_deleted = Keyword.get(opts, :with_deleted, false)

    link =
      Link.get!(:system, id: link_id, opts: [preload: [:node, :resource_hub], with_deleted: with_deleted])
      |> Parent.prepare_for_notifications()

    SubscribersLoader.load_for_notifications(link, Parent.notification_people(link.resource_hub), ignore)
  end
end
