defmodule OperatelyWeb.Api.Queries.GetResourceHubFolderTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_resource_hub_folder, %{})
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
        folder = folder_fixture(resource_hub.id)
        document_fixture(resource_hub.id, %{parent_folder_id: folder.id})
        document_fixture(resource_hub.id, %{parent_folder_id: folder.id})

        assert {code, res} = query(ctx.conn, :get_resource_hub_folder, %{id: Paths.folder_id(folder)})

        assert code == @test.expected

        case @test.expected do
          404 ->
            assert res.message == "The requested resource was not found"
          200 ->
            assert length(res.folder.nodes) == 2
        end
      end
    end
  end

  describe "get_resource_hub_test functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder1, :hub)
      |> Factory.preload(:folder1, :node)
      |> Factory.add_document(:doc1, :hub, :folder1)
      |> Factory.add_document(:doc2, :hub, :folder1)
      |> Factory.add_folder(:folder2, :hub)
      |> Factory.preload(:folder2, :node)
      |> Factory.add_document(:doc3, :hub, :folder2)
      |> Factory.add_document(:doc4, :hub, :folder2)
    end

    test "list all files within folder", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_folder, %{id: Paths.folder_id(ctx.folder1)})

      assert res.folder.name == ctx.folder1.node.name
      assert length(res.folder.nodes) == 2

      [ctx.doc1, ctx.doc2]
      |> Enum.each(fn doc ->
        node = Repo.preload(doc, :node).node

        assert Enum.find(res.folder.nodes, &(&1.id == Paths.node_id(node)))
      end)

      assert {200, res} = query(ctx.conn, :get_resource_hub_folder, %{id: Paths.folder_id(ctx.folder2)})

      assert res.folder.name == ctx.folder2.node.name
      assert length(res.folder.nodes) == 2

      [ctx.doc3, ctx.doc4]
      |> Enum.each(fn doc ->
        node = Repo.preload(doc, :node).node

        assert Enum.find(res.folder.nodes, &(&1.id == Paths.node_id(node)))
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
