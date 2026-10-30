defmodule OperatelyWeb.Api.Links.CreateTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs
  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Notifications.{SubscriptionList, Subscription}

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  setup ctx do
    ctx |> Factory.setup()
  end

  test "publishes a project update for project links only", ctx do
    ctx = ctx |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)
      |> Factory.fetch_default_resource_hub(:space_hub, :space) |> Factory.log_in_person(:creator)
    topic = "api:project_updated:#{ctx.project.id}"
    OperatelyWeb.Endpoint.subscribe(topic)
    inputs = %{resource_hub_id: Paths.resource_hub_id(ctx.project_hub), name: "Reference", url: "https://example.com", type: "other"}
    assert {200, _} = mutation(ctx.conn, [:links, :create], inputs)
    assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event"}
    assert {200, _} = mutation(ctx.conn, [:links, :create], %{inputs | resource_hub_id: Paths.resource_hub_id(ctx.space_hub)})
    refute_receive %Phoenix.Socket.Broadcast{topic: ^topic}
    assert {400, _} = mutation(ctx.conn, [:links, :create], Map.delete(inputs, :name))
    refute_receive %Phoenix.Socket.Broadcast{topic: ^topic}
  end

  describe "destination folder authorization" do
    setup ctx do
      ctx
      |> Factory.add_company_member(:actor)
      |> Factory.add_space(:source_space, company_permissions: Binding.edit_access())
      |> Factory.fetch_default_resource_hub(:hub, :source_space)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_blob(:blob, :actor)
      |> Factory.log_in_person(:actor)
    end

    for destination <- [:foreign, :inaccessible, :accessible_other_hub, :missing] do
      @destination destination

      test "rejects #{@destination} destination before writes", ctx do
        destination_id =
          case @destination do
            :foreign ->
              foreign = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space) |> Factory.add_folder(:folder, :hub)
              foreign.folder.id

            :missing ->
              Ecto.UUID.generate()

            scope ->
              access = if scope == :inaccessible, do: Binding.no_access(), else: Binding.edit_access()

              other =
                ctx |> Factory.add_space(:other_space, company_permissions: access) |> Factory.fetch_default_resource_hub(:other_hub, :other_space) |> Factory.add_folder(:other_folder, :other_hub)

              other.other_folder.id
          end

        nodes = Repo.all(Operately.ResourceHubs.Node)
        activities = Repo.aggregate(Operately.Activities.Activity, :count)
        subscriptions = Repo.aggregate(Operately.Notifications.SubscriptionList, :count)

        ctx = Factory.add_api_token(ctx, :destination_token, :actor, read_only: false)
        assert {404, _} = mutation(ctx.conn, [:links, :create], %{resource_hub_id: ctx.hub.id, folder_id: destination_id, name: "Link", url: "https://example.com", type: "other"})

        assert {404, _} =
                 external_mutation(ctx.conn, ctx.destination_token, "links/create", %{resource_hub_id: ctx.hub.id, folder_id: destination_id, name: "Link", url: "https://example.com", type: "other"})

        assert Repo.all(Operately.ResourceHubs.Node) == nodes
        assert Repo.aggregate(Operately.Activities.Activity, :count) == activities
        assert Repo.aggregate(Operately.Notifications.SubscriptionList, :count) == subscriptions
        assert Repo.reload(ctx.blob).status == :pending
      end
    end
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:links, :create], %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},

      %{company: :no_access,      space: :comment_access, expected: 403},
      %{company: :no_access,      space: :edit_access,    expected: 200},
      %{company: :no_access,      space: :full_access,    expected: 200},

      %{company: :comment_access, space: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        resource_hub = resource_hub_fixture(ctx.creator, space)

        assert {code, res} = mutation(ctx.conn, [:links, :create], %{
          resource_hub_id: Paths.resource_hub_id(resource_hub),
          name: "My file",
          url: "http://localhost:4000",
          description: RichText.rich_text("description", :as_string),
          type: "other",
          send_notifications_to_everyone: true,
          subscriber_ids: [],
        })
        assert code == @test.expected

        case @test.expected do
          200 ->
            links = ResourceHubs.list_links(resource_hub)
            assert res.link.id == Paths.link_id(hd(links))
          403 ->
            assert ResourceHubs.list_links(resource_hub) == []
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert ResourceHubs.list_links(resource_hub) == []
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.log_in_person(:person)
      |> Factory.fetch_default_resource_hub(:hub, :space)
    end

    test "creates file within hub", ctx do
      assert ResourceHubs.list_links(ctx.hub) == []

      assert {200, res} = mutation(ctx.conn, [:links, :create], %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        name: "My file",
        url: "http://localhost:4000",
        description: RichText.rich_text("description", :as_string),
        type: "other",
        send_notifications_to_everyone: true,
        subscriber_ids: [Paths.person_id(ctx.creator)],
      })

      links = ResourceHubs.list_links(ctx.hub)
      assert length(links) == 1

      link = hd(links)
      assert res.link.id == Paths.link_id(link)

      assert {:ok, list} = SubscriptionList.get(:system, parent_id: link.id)
      assert {:ok, _} = Subscription.get(:system, subscription_list_id: list.id, person_id: ctx.creator.id)
    end

    test "creates link without description", ctx do
      assert ResourceHubs.list_links(ctx.hub) == []

      assert {200, res} = mutation(ctx.conn, [:links, :create], %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        name: "Link without description",
        url: "https://example.com",
        type: "other",
      })

      links = ResourceHubs.list_links(ctx.hub)
      assert length(links) == 1

      link = Repo.preload(hd(links), :node)

      assert res.link.id == Paths.link_id(link)
      assert link.name == "Link without description"
      assert link.node.name == nil
      assert link.url == "https://example.com"
      assert link.description == Operately.RichContent.Builder.empty_content()
    end

    test "requires resource_hub_id", ctx do
      assert {400, _} =
               mutation(ctx.conn, [:links, :create], %{
                 name: "My link",
                 url: "http://localhost:4000",
                 type: "other",
               })
    end
  end

  describe "subscriptions to notifications" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:p1, :space)
      |> Factory.add_space_member(:p2, :space)
      |> Factory.add_space_member(:p3, :space)
      |> Factory.log_in_person(:creator)
      |> Factory.add_resource_hub(:hub, :space, :creator)
    end

    test "uses defaults for omitted optional inputs", ctx do
      assert {200, res} = mutation(ctx.conn, [:links, :create], %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        name: "My link",
        url: "http://localhost:4000",
        type: "other",
      })

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.link.id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

      refute list.send_to_everyone
      assert length(list.subscriptions) == 1
      assert hd(list.subscriptions).person_id == ctx.creator.id
    end
  end

  #
  # Helpers
  #

  defp create_space(ctx, company_members_level, space_members_level) do
    space = group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.from_atom(company_members_level)})

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    space
  end
end
