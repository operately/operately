defmodule Operately.Data.Change046UpdateFileCreatedActivityFormatTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_file(:my_file, :hub)
    |> Factory.preload(:my_file, :node)
    |> create_activities()
  end

  test "updates activities content", ctx do
    Enum.each(ctx.activities, fn a ->
      assert a.content["file_id"] == ctx.my_file.id
      assert a.content["file_name"] == ctx.my_file.node.name
    end)

    Operately.Data.Change046UpdateFileCreatedActivityFormat.run()

    Enum.each(ctx.activities, fn a ->
      a = Repo.reload(a)

      refute a.content["file_id"]
      refute a.content["file_name"]

      assert a.content["company_id"] == ctx.company.id
      assert a.content["space_id"] == ctx.space.id
      assert a.content["resource_hub_id"] == ctx.hub.id
      assert a.content["files"] == [%{"file_id" => ctx.my_file.id, "node_id" => ctx.my_file.node.id}]
    end)
  end

  #
  # Helpers
  #

  defp create_activities(ctx) do
    activities = Enum.map(1..3, fn _ ->
      activity_fixture(author_id: ctx.creator.id, action: "resource_hub_file_created", content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "resource_hub_id" => ctx.hub.id,
        "file_id" => ctx.my_file.id,
        "file_name" => ctx.my_file.node.name,
      })
    end)

    Map.put(ctx, :activities, activities)
  end
end
