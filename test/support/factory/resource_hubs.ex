defmodule Operately.Support.Factory.ResourceHubs do
  def add_resource_hub(ctx, testid, space_name, creator_name, attrs \\ []) do
    space = Map.fetch!(ctx, space_name)
    creator = Map.fetch!(ctx, creator_name)

    hub = Operately.ResourceHubsFixtures.resource_hub_fixture(creator, space, attrs)

    Map.put(ctx, testid, hub)
  end

  def add_folder(ctx, testid, hub_name, folder_name \\ nil) do
    hub = Map.fetch!(ctx, hub_name)
    folder = folder_name && Map.fetch!(ctx, folder_name)

    folder = Operately.ResourceHubsFixtures.folder_fixture(hub.id, %{
      name: Atom.to_string(testid),
      parent_folder_id: folder && folder.id,
    })

    Map.put(ctx, testid, folder)
  end

  def add_document(ctx, testid, hub_name, opts \\ []) do
    hub = Map.fetch!(ctx, hub_name)

    author_key = Keyword.get(opts, :author, :creator)
    author = Map.fetch!(ctx, author_key)

    folder_key = Keyword.get(opts, :folder)
    folder = folder_key && Map.fetch!(ctx, folder_key)

    attrs = Enum.into(opts, %{parent_folder_id: folder && folder.id})

    document = Operately.ResourceHubsFixtures.document_fixture(hub.id, author.id, attrs)

    Map.put(ctx, testid, document)
  end

  def add_file(ctx, testid, hub_name, opts \\ []) do
    hub = Map.fetch!(ctx, hub_name)

    author_key = Keyword.get(opts, :author, :creator)
    author = Map.fetch!(ctx, author_key)

    folder_key = Keyword.get(opts, :folder)
    folder = folder_key && Map.fetch!(ctx, folder_key)

    file = Operately.ResourceHubsFixtures.file_fixture(hub, author, parent_folder_id: folder && folder.id)

    Map.put(ctx, testid, file)
  end

  def add_link(ctx, testid, hub_name, opts \\ []) do
    hub = Map.fetch!(ctx, hub_name)

    author_key = Keyword.get(opts, :author, :creator)
    author = Map.fetch!(ctx, author_key)

    folder_key = Keyword.get(opts, :folder)
    folder = folder_key && Map.fetch!(ctx, folder_key)

    link = Operately.ResourceHubsFixtures.link_fixture(hub, author, %{parent_folder_id: folder && folder.id})

    Map.put(ctx, testid, link)
  end
end
