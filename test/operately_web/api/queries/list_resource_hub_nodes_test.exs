defmodule OperatelyWeb.Api.Queries.ListResourceHubNodesTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :list_resource_hub_nodes, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    @space [
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

    tabletest @space do
      test "Resource Hubs - if caller has levels company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)
        resource_hub = resource_hub_fixture(ctx.creator, space)
        link_fixture(resource_hub, ctx.creator)
        file_fixture(resource_hub, ctx.creator)
        document_fixture(resource_hub.id, ctx.creator.id, %{state: :published})
        document_fixture(resource_hub.id, ctx.person.id, %{state: :draft})
        document_fixture(resource_hub.id, ctx.creator.id, %{state: :draft}) # never returned as the request is not from the author

        assert {200, res} = query(ctx.conn, :list_resource_hub_nodes, %{
          resource_hub_id: Paths.resource_hub_id(resource_hub),
        })

        case @test.expected do
          :forbidden ->
            assert length(res.nodes) == 0
            assert length(res.draft_nodes) == 0
          :allowed ->
            assert length(res.nodes) == 3
            assert length(res.draft_nodes) == 1
        end
      end
    end
  end

  describe "list_resource_hub_nodes functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document1, :hub, state: :draft)
      |> Factory.add_document(:document2, :hub)
      |> Factory.add_link(:link1, :hub)
      |> Factory.add_link(:link2, :hub)
      |> Factory.add_file(:file1, :hub)
      |> Factory.add_file(:file2, :hub)
    end

    test "fetches all nodes", ctx do
      assert {200, res} = query(ctx.conn, :list_resource_hub_nodes, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
      })

      assert length(res.nodes) == 5
      assert length(res.draft_nodes) == 1

      assert hd(res.draft_nodes).document.id == Paths.document_id(ctx.document1)
      assert Enum.find(res.nodes, &(&1[:document] && &1.document.id == Paths.document_id(ctx.document2)))
      assert Enum.find(res.nodes, &(&1[:link] && &1.link.id == Paths.link_id(ctx.link1)))
      assert Enum.find(res.nodes, &(&1[:link] && &1.link.id == Paths.link_id(ctx.link2)))
      assert Enum.find(res.nodes, &(&1[:file] && &1.file.id == Paths.file_id(ctx.file1)))
      assert Enum.find(res.nodes, &(&1[:file] && &1.file.id == Paths.file_id(ctx.file2)))
    end

    test "list only nodes within folder", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:folder, :hub)
        |> Factory.add_document(:document3, :hub, folder: :folder, state: :draft)
        |> Factory.add_document(:document4, :hub, folder: :folder)

      assert {200, res} = query(ctx.conn, :list_resource_hub_nodes, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
      })

      assert length(res.nodes) == 6
      assert length(res.draft_nodes) == 1

      assert {200, res} = query(ctx.conn, :list_resource_hub_nodes, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        folder_id: Paths.folder_id(ctx.folder)
      })

      assert length(res.nodes) == 1
      assert length(res.draft_nodes) == 1
      assert hd(res.draft_nodes).document.id == Paths.document_id(ctx.document3)
      assert hd(res.nodes).document.id == Paths.document_id(ctx.document4)
    end

    test "include_comments_count", ctx do
      ctx =
        ctx
        |> Factory.preload(:document1, :resource_hub)
        |> Factory.preload(:document2, :resource_hub)
        |> Factory.add_comment(:comment1, :document1)
        |> Factory.add_comment(:comment2, :document2)

      assert {200, res} = query(ctx.conn, :list_resource_hub_nodes, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
      })

      node1 = hd(res.draft_nodes)
      node2 = Enum.find(res.nodes, &(&1[:document] && &1.document.id == Paths.document_id(ctx.document2)))
      refute node1.document.comments_count
      refute node2.document.comments_count

      assert {200, res} = query(ctx.conn, :list_resource_hub_nodes, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        include_comments_count: true,
      })

      node1 = hd(res.draft_nodes)
      node2 = Enum.find(res.nodes, &(&1[:document] && &1.document.id == Paths.document_id(ctx.document2)))
      assert node1.document.comments_count == 1
      assert node2.document.comments_count == 1
    end

    test "include_children_count", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:parent_folder, :hub)
        |> Factory.add_folder(:folder, :hub, :parent_folder)
        |> Factory.add_document(:document3, :hub, folder: :folder, state: :draft)
        |> Factory.add_document(:document4, :hub, folder: :folder)
        |> Factory.add_link(:link3, :hub, folder: :folder)
        |> Factory.add_file(:file3, :hub, folder: :folder)

      assert {200, res} = query(ctx.conn, :list_resource_hub_nodes, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        folder_id: Paths.folder_id(ctx.parent_folder)
      })

      node = hd(res.nodes)
      refute node.folder.children_count

      assert {200, res} = query(ctx.conn, :list_resource_hub_nodes, %{
        resource_hub_id: Paths.resource_hub_id(ctx.hub),
        folder_id: Paths.folder_id(ctx.parent_folder),
        include_children_count: true,
      })

      node = hd(res.nodes)
      assert node.folder.children_count == 3
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
