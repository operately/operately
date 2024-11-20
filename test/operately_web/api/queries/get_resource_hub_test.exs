defmodule OperatelyWeb.Api.Queries.ListResourceHubContentTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_resource_hub, %{})
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
        space = create_space(ctx)
        resource_hub = create_resource_hub(ctx, space, @test.company, @test.space)
        folder_fixture(resource_hub.id)

        assert {code, res} = query(ctx.conn, :get_resource_hub, %{id: Paths.resource_hub_id(resource_hub), include_nodes: true})

        assert code == @test.expected

        case @test.expected do
          404 ->
            assert res.message == "The requested resource was not found"
          200 ->
            assert length(res.resource_hub.nodes) == 1
        end
      end
    end
  end

  describe "get_resource_hub functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub1, :space, :creator)
      |> Factory.add_resource_hub(:hub2, :space, :creator)
      |> Factory.add_folder(:folder1, :hub1)
      |> Factory.add_folder(:folder2, :hub1)
      |> Factory.add_folder(:folder3, :hub1)
      |> Factory.add_folder(:folder4, :hub2)
      |> Factory.add_folder(:folder5, :hub2)
    end

    test "include_nodes", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub, %{id: Paths.resource_hub_id(ctx.hub1), include_nodes: true})

      assert res.resource_hub.name == ctx.hub1.name
      assert length(res.resource_hub.nodes) == 3

      [ctx.folder1, ctx.folder2, ctx.folder3]
      |> Enum.each(fn folder ->
        node = Repo.preload(folder, :node).node

        assert Enum.find(res.resource_hub.nodes, &(&1.id == Paths.node_id(node)))
      end)

      assert {200, res} = query(ctx.conn, :get_resource_hub, %{id: Paths.resource_hub_id(ctx.hub2), include_nodes: true})

      assert res.resource_hub.name == ctx.hub2.name
      assert length(res.resource_hub.nodes) == 2

      [ctx.folder4, ctx.folder5]
      |> Enum.each(fn folder ->
        node = Repo.preload(folder, :node).node

        assert Enum.find(res.resource_hub.nodes, &(&1.id == Paths.node_id(node)))
      end)
    end

    test "include_space", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub, %{id: Paths.resource_hub_id(ctx.hub1)})
      refute res.resource_hub.space

      assert {200, res} = query(ctx.conn, :get_resource_hub, %{id: Paths.resource_hub_id(ctx.hub1), include_space: true})
      assert res.resource_hub.space == Serializer.serialize(ctx.space, level: :essential)
    end
  end

  #
  # Helpers
  #

  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  def create_resource_hub(ctx, space, company_members_level, space_members_level) do
    resource_hub = resource_hub_fixture(ctx.creator, space, %{
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    resource_hub
  end
end
