defmodule OperatelyWeb.Api.Queries.ListResourceHubContentTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :list_resource_hub_content, %{})
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
      %{company: :no_access,      space: :no_access,      expected: :forbidden},

      %{company: :no_access,      space: :view_access,    expected: :allowed},
      %{company: :no_access,      space: :comment_access, expected: :allowed},
      %{company: :no_access,      space: :edit_access,    expected: :allowed},
      %{company: :no_access,      space: :full_access,    expected: :allowed},

      %{company: :view_access,    space: :no_access,      expected: :allowed},
      %{company: :comment_access, space: :no_access,      expected: :allowed},
      %{company: :edit_access,    space: :no_access,      expected: :allowed},
      %{company: :full_access,    space: :no_access,      expected: :allowed},
    ]

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        resource_hub = create_resource_hub(ctx, space, @test.company, @test.space)
        folder = folder_fixture(resource_hub.id)

        assert {200, res} = query(ctx.conn, :list_resource_hub_content, %{resource_hub_id: Paths.resource_hub_id(resource_hub)})

        case @test.expected do
          :forbidden ->
            assert res == %{nodes: []}
          :allowed ->
            folder = Repo.preload(folder, :node)
            node = Map.put(folder.node, :type, Atom.to_string(folder.node.type))

            assert res == %{nodes: [Serializer.serialize(node)]}
        end
      end
    end
  end

  describe "list_resource_hub_content functionality" do
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

    test "list all files within hub", ctx do
      assert {200, res} = query(ctx.conn, :list_resource_hub_content, %{resource_hub_id: Paths.resource_hub_id(ctx.hub1)})
      assert length(res.nodes) == 3

      [ctx.folder1, ctx.folder2, ctx.folder3]
      |> Enum.each(fn folder ->
        node = Repo.preload(folder, :node).node

        assert Enum.find(res.nodes, &(&1.id == Paths.node_id(node)))
      end)

      assert {200, res} = query(ctx.conn, :list_resource_hub_content, %{resource_hub_id: Paths.resource_hub_id(ctx.hub2)})
      assert length(res.nodes) == 2

      [ctx.folder4, ctx.folder5]
      |> Enum.each(fn folder ->
        node = Repo.preload(folder, :node).node

        assert Enum.find(res.nodes, &(&1.id == Paths.node_id(node)))
      end)
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
