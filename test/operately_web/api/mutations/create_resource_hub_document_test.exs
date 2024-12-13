defmodule OperatelyWeb.Api.Mutations.CreateResourceHubDocumentTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs
  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Notifications.SubscriptionList

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_resource_hub_document, %{})
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

        assert {code, res} = mutation(ctx.conn, :create_resource_hub_document, %{
          resource_hub_id: Paths.resource_hub_id(resource_hub),
          name: "My document",
          content: RichText.rich_text("content", :as_string)
        })
        assert code == @test.expected

        case @test.expected do
          200 ->
            documents = ResourceHubs.list_documents(resource_hub)
            assert res.document.id == Paths.document_id(hd(documents))
          403 ->
            assert ResourceHubs.list_documents(resource_hub) == []
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert ResourceHubs.list_documents(resource_hub) == []
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
      |> Factory.add_resource_hub(:hub, :space, :person)
    end

    test "creates document within hub", ctx do
      assert ResourceHubs.list_documents(ctx.hub) == []

      assert {200, res} = mutation(ctx.conn, :create_resource_hub_document, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        name: "My document",
        content: RichText.rich_text("content", :as_string)
      })

      documents = ResourceHubs.list_documents(ctx.hub)

      assert length(documents) == 1
      assert res.document.id == Paths.document_id(hd(documents))
    end

    test "creates document within folder", ctx do
      ctx = Factory.add_folder(ctx, :folder, :hub)

      assert ResourceHubs.list_documents(ctx.folder) == []

      assert {200, res} = mutation(ctx.conn, :create_resource_hub_document, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        folder_id: Paths.folder_id(ctx.folder),
        name: "My document",
        content: RichText.rich_text("content", :as_string)
      })

      documents = ResourceHubs.list_documents(ctx.folder)

      assert length(documents) == 1
      assert res.document.id == Paths.document_id(hd(documents))
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

    test "creates subscription list for document", ctx do
      people = [ctx.p1, ctx.p2, ctx.p3]

      assert {200, res} = mutation(ctx.conn, :create_resource_hub_document, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        name: "My document",
        content: RichText.rich_text("content", :as_string),
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(people, &(Paths.person_id(&1))),
      })

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.document.id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

      assert list.send_to_everyone
      assert length(list.subscriptions) == 4

      Enum.each([ctx.creator | people], fn p ->
        assert Enum.filter(list.subscriptions, &(&1.person_id == p.id))
      end)
    end

    test "adds mentioned people to subscription list", ctx do
      people = [ctx.p1, ctx.p2, ctx.p3]
      content = RichText.rich_text(mentioned_people: people)

      assert {200, res} = mutation(ctx.conn, :create_resource_hub_document, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        name: "My document",
        content: content,
        send_notifications_to_everyone: false,
        subscriber_ids: [],
      })

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.document.id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

      assert length(list.subscriptions) == 4

      Enum.each([ctx.creator | people], fn p ->
        assert Enum.filter(list.subscriptions, &(&1.person_id == p.id))
      end)
    end

    test "doesn't create repeated subscription", ctx do
      people = [ctx.creator, ctx.p1, ctx.p2, ctx.p3]
      content = RichText.rich_text(mentioned_people: people)

      assert {200, res} = mutation(ctx.conn, :create_resource_hub_document, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        name: "My document",
        content: content,
        send_notifications_to_everyone: false,
        subscriber_ids: Enum.map(people, &(Paths.person_id(&1))),
      })

      {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.document.id)
      {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

      assert length(list.subscriptions) == 4

      Enum.each(people, fn p ->
        assert Enum.filter(list.subscriptions, &(&1.person_id == p.id))
      end)
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
