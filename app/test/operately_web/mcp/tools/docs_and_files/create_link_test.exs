defmodule OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateLinkTest do
  use Operately.DataCase, async: true

  alias Operately.Notifications.SubscriptionList
  alias Operately.ResourceHubs.Link
  alias Operately.RichContent.Builder
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.DocsAndFiles.CreateLink
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 creates a link in a space hub with safe notification defaults" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:ok, %{link: link}} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other",
               "description" => "Initial link description"
             })

    link = Operately.Repo.get!(Link, ToolConnHelper.decode_id!(link.id))

    assert link.url == "https://example.com"
    assert ToolConnHelper.rich_text_to_string(link.description) == "Initial link description"

    list = subscription_list!(link.id)

    refute list.send_to_everyone
    assert Enum.map(list.subscriptions, & &1.person_id) == [ctx.creator.id]
  end

  test "call/2 creates a link with optional fields omitted" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:ok, %{link: link}} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other"
             })

    link = Operately.Repo.get!(Link, ToolConnHelper.decode_id!(link.id))

    assert link.url == "https://example.com"
    assert link.type == :other
    assert link.description == Builder.empty_content()
  end

  test "call/2 creates a link in a project hub" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:hub, :project)

    assert {:ok, %{link: link}} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project),
               "name" => "Project MCP Link",
               "url" => "https://example.com/project",
               "type" => "notion"
             })

    link = Operately.Repo.get!(Link, ToolConnHelper.decode_id!(link.id))

    assert link.url == "https://example.com/project"
    assert link.type == :notion
  end

  test "subscribes selected people from notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:other)
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:ok, %{link: link}} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other",
               "notify_person_ids" => [Paths.person_id(ctx.other)]
             })

    list = subscription_list!(ToolConnHelper.decode_id!(link.id))

    refute list.send_to_everyone
    assert Enum.sort(Enum.map(list.subscriptions, & &1.person_id)) == Enum.sort([ctx.creator.id, ctx.other.id])
  end

  test "sets send_to_everyone when notify_everyone is true" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:ok, %{link: link}} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other",
               "notify_everyone" => true
             })

    list = subscription_list!(ToolConnHelper.decode_id!(link.id))

    assert list.send_to_everyone
  end

  test "returns invalid_arguments when hub scope is missing" do
    ctx =
      %{}
      |> Factory.setup()

    assert {:error, :invalid_arguments} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other"
             })
  end

  test "returns invalid_arguments for conflicting hub scopes" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:error, :invalid_arguments} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "project_id" => Paths.project_id(ctx.project),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other"
             })
  end

  test "returns invalid_arguments for an unsupported link type" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:error, :invalid_arguments} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "invalid"
             })
  end

  test "returns invalid_arguments for malformed notify_person_ids" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:error, :invalid_arguments} =
             CreateLink.call(ToolConnHelper.conn(ctx), %{
               "space_id" => Paths.space_id(ctx.space),
               "name" => "MCP Link",
               "url" => "https://example.com",
               "type" => "other",
               "notify_person_ids" => ["definitely-not-a-valid-operately-id-%%%"]
             })
  end

  defp subscription_list!(parent_id) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: parent_id, opts: [preload: :subscriptions])
    list
  end
end
