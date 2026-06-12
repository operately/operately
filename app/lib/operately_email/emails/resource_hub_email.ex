defmodule OperatelyEmail.Emails.ResourceHubEmail do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.ResourceHubs.{Document, File, Link, Parent}

  def load_document(id, opts \\ []) do
    with_deleted = Keyword.get(opts, :with_deleted, false)

    Document.get!(:system, id: id, opts: [with_deleted: with_deleted])
    |> Parent.preload_child_resource_hub(with_deleted: with_deleted)
  end

  def load_file(id, opts \\ []) do
    with_deleted = Keyword.get(opts, :with_deleted, false)

    File.get!(:system, id: id, opts: [with_deleted: with_deleted])
    |> Parent.preload_child_resource_hub(with_deleted: with_deleted)
  end

  def load_link(id, opts \\ []) do
    with_deleted = Keyword.get(opts, :with_deleted, false)

    Link.get!(:system, id: id, opts: [with_deleted: with_deleted])
    |> Parent.preload_child_resource_hub(with_deleted: with_deleted)
  end

  def load_files(file_ids) do
    from(f in File,
      where: f.id in ^file_ids,
      preload: [node: [:parent_folder, :resource_hub]]
    )
    |> Repo.all()
    |> Enum.map(&Parent.preload_child_resource_hub/1)
  end

  def parent(resource) do
    Parent.notification_parent(resource.resource_hub)
  end
end
