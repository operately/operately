defmodule Operately.Support.Factory.ResourceHubs do
  def add_resource_hub(ctx, testid, space_name, space_access_level \\ :no_access) do
    space = Map.fetch!(ctx, space_name)

    hub = Operately.ResourceHubsFixtures.resource_hub_fixture(space.id, %{space_access_level: space_access_level})

    Map.put(ctx, testid, hub)
  end

  def add_folder(ctx, testid, hub_name, folder_name \\ nil) do
    hub = Map.fetch!(ctx, hub_name)
    folder = folder_name && Map.fetch!(ctx, folder_name)

    folder = Operately.ResourceHubsFixtures.folder_fixture(hub.id, %{folder_id: folder && folder.id})

    Map.put(ctx, testid, folder)
  end
end