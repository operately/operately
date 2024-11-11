defmodule OperatelyWeb.Api.Mutations.CreateResourceHubFolderTest do
  use OperatelyWeb.TurboCase

  alias Operately.Support.RichText
  alias Operately.ResourceHubs

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_resource_hub_folder, %{})
    end
  end

  describe "permissions" do

  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.log_in_person(:person)
      |> Factory.add_resource_hub(:hub, :space, :edit_access)
    end

    test "creates folder within hub", ctx do
      assert ResourceHubs.list_folders(ctx.hub) == []

      assert {200, res} = mutation(ctx.conn, :create_resource_hub_folder, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        name: "My folder",
        description: RichText.rich_text("description", :as_string)
      })

      folders = ResourceHubs.list_folders(ctx.hub)

      assert length(folders) == 1
      assert res.folder == Serializer.serialize(hd(folders))
    end

    test "creates folder within folder", ctx do
      ctx = Factory.add_folder(ctx, :folder, :hub)

      assert ResourceHubs.list_folders(ctx.folder) == []

      assert {200, res} = mutation(ctx.conn, :create_resource_hub_folder, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        folder_id: Paths.folder_id(ctx.folder),
        name: "My folder",
        description: RichText.rich_text("description", :as_string)
      })

      folders = ResourceHubs.list_folders(ctx.folder)

      assert length(folders) == 1
      assert res.folder == Serializer.serialize(hd(folders))
    end
  end
end
