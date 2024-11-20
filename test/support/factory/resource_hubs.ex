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

    folder = Operately.ResourceHubsFixtures.folder_fixture(hub.id, %{parent_folder_id: folder && folder.id})

    Map.put(ctx, testid, folder)
  end

  def add_document(ctx, testid, hub_name, folder_name \\ nil) do
    hub = Map.fetch!(ctx, hub_name)
    folder = folder_name && Map.fetch!(ctx, folder_name)

    document = Operately.ResourceHubsFixtures.document_fixture(hub.id, %{parent_folder_id: folder && folder.id})

    Map.put(ctx, testid, document)
  end
end
