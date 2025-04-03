defmodule OperatelyWeb.Api.Queries.GetResourceHubLinkTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_resource_hub_link, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
      |> Factory.add_space(:space)
    end

    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},

      %{company: :no_access,      space: :view_access,    expected: 200},
      %{company: :no_access,      space: :comment_access, expected: 200},
      %{company: :no_access,      space: :edit_access,    expected: 200},
      %{company: :no_access,      space: :full_access,    expected: 200},

      %{company: :view_access,    space: :no_access,      expected: 200},
      %{company: :comment_access, space: :no_access,      expected: 200},
      %{company: :edit_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      expected: 200},
    ]

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        resource_hub = resource_hub_fixture(ctx.creator, space)
        link = link_fixture(resource_hub, ctx.creator)

        assert {code, res} = query(ctx.conn, :get_resource_hub_link, %{id: Paths.link_id(link)})

        assert code == @test.expected

        case @test.expected do
          404 ->
            assert res.message == "The requested resource was not found"
          200 ->
            assert res.link.id == Paths.link_id(link)
        end
      end
    end
  end

  describe "get_resource_hub_link functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_link(:link, :hub, folder: :folder)
      |> Factory.preload(:link, :node)
    end

    test "get link", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{id: Paths.link_id(ctx.link)})

      assert res.link == Serializer.serialize(ctx.link, level: :full)
    end

    test "include_author", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{id: Paths.link_id(ctx.link)})

      refute res.link.author

      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{
        id: Paths.link_id(ctx.link),
        include_author: true,
      })

      assert res.link.author == Serializer.serialize(ctx.creator)
    end

    test "include_resource_hub", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{id: Paths.link_id(ctx.link)})

      refute res.link.resource_hub

      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{
        id: Paths.link_id(ctx.link),
        include_resource_hub: true,
      })

      assert res.link.resource_hub == Serializer.serialize(ctx.hub)
    end

    test "include_parent_folder", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{id: Paths.link_id(ctx.link)})

      refute res.link.parent_folder

      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{
        id: Paths.link_id(ctx.link),
        include_parent_folder: true,
      })

      assert res.link.parent_folder == Repo.preload(ctx.folder, :node) |> Serializer.serialize()
    end

    test "include_reactions", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{id: Paths.link_id(ctx.link)})
      refute res.link.reactions

      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{
        id: Paths.link_id(ctx.link),
        include_reactions: true,
      })
      assert res.link.reactions == []

      {:ok, reaction} = Operately.Updates.create_reaction(%{
        person_id: ctx.creator.id,
        entity_id: ctx.link.id,
        entity_type: :resource_hub_link,
        emoji: "👍"
      })
      reaction = Repo.preload(reaction, [:person])

      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{
        id: Paths.link_id(ctx.link),
        include_reactions: true,
      })
      assert res.link.reactions == [Serializer.serialize(reaction)]
    end

    test "include_permissions", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{id: Paths.link_id(ctx.link)})
      refute res.link.permissions

      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{
        id: Paths.link_id(ctx.link),
        include_permissions: true,
      })
      assert res.link.permissions
    end

    test "include_subscriptions_list", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{id: Paths.link_id(ctx.link)})
      refute res.link.subscription_list

      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{
        id: Paths.link_id(ctx.link),
        include_subscriptions_list: true,
      })
      assert res.link.subscription_list
    end

    test "include_potential_subscribers", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{id: Paths.link_id(ctx.link)})
      refute res.link.potential_subscribers

      assert {200, res} = query(ctx.conn, :get_resource_hub_link, %{
        id: Paths.link_id(ctx.link),
        include_potential_subscribers: true,
      })
      assert res.link.potential_subscribers
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
