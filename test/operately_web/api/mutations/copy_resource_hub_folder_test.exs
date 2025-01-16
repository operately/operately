defmodule OperatelyWeb.Api.Mutations.CopyResourceHubFolderTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs
  alias Operately.Access.Binding

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :copy_resource_hub_folder, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      origin_space: :no_access,     dest_space: :no_access,       expected: 404},
      %{company: :no_access,      origin_space: :no_access,     dest_space: :view_access,     expected: 404},
      %{company: :no_access,      origin_space: :no_access,     dest_space: :comment_access,  expected: 404},
      %{company: :no_access,      origin_space: :no_access,     dest_space: :edit_access,     expected: 404},
      %{company: :no_access,      origin_space: :no_access,     dest_space: :full_access,     expected: 404},

      %{company: :no_access,      origin_space: :view_access,     dest_space: :no_access,       expected: 404},
      %{company: :no_access,      origin_space: :view_access,     dest_space: :view_access,     expected: 403},
      %{company: :no_access,      origin_space: :view_access,     dest_space: :comment_access,  expected: 403},
      %{company: :no_access,      origin_space: :view_access,     dest_space: :edit_access,     expected: 403},
      %{company: :no_access,      origin_space: :view_access,     dest_space: :full_access,     expected: 403},

      %{company: :no_access,      origin_space: :comment_access,     dest_space: :no_access,       expected: 404},
      %{company: :no_access,      origin_space: :comment_access,     dest_space: :view_access,     expected: 403},
      %{company: :no_access,      origin_space: :comment_access,     dest_space: :comment_access,  expected: 403},
      %{company: :no_access,      origin_space: :comment_access,     dest_space: :edit_access,     expected: 403},
      %{company: :no_access,      origin_space: :comment_access,     dest_space: :full_access,     expected: 403},

      %{company: :no_access,      origin_space: :edit_access,     dest_space: :no_access,       expected: 404},
      %{company: :no_access,      origin_space: :edit_access,     dest_space: :view_access,     expected: 403},
      %{company: :no_access,      origin_space: :edit_access,     dest_space: :comment_access,  expected: 403},
      %{company: :no_access,      origin_space: :edit_access,     dest_space: :edit_access,     expected: 200},
      %{company: :no_access,      origin_space: :edit_access,     dest_space: :full_access,     expected: 200},

      %{company: :no_access,      origin_space: :full_access,     dest_space: :no_access,       expected: 404},
      %{company: :no_access,      origin_space: :full_access,     dest_space: :view_access,     expected: 403},
      %{company: :no_access,      origin_space: :full_access,     dest_space: :comment_access,  expected: 403},
      %{company: :no_access,      origin_space: :full_access,     dest_space: :edit_access,     expected: 200},
      %{company: :no_access,      origin_space: :full_access,     dest_space: :full_access,     expected: 200},

      %{company: :view_access,      origin_space: :no_access,     dest_space: :no_access,     expected: 403},
      %{company: :comment_access,   origin_space: :no_access,     dest_space: :no_access,     expected: 403},
      %{company: :edit_access,      origin_space: :no_access,     dest_space: :no_access,     expected: 200},
      %{company: :full_access,      origin_space: :no_access,     dest_space: :no_access,     expected: 200},
    ]

    setup ctx do
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, origin_space=#{@test.origin_space} and dest_space=#{@test.dest_space}, then expect code=#{@test.expected}", ctx do
        origin_space = create_space(ctx, @test.company, @test.origin_space)
        dest_space = create_space(ctx, @test.company, @test.dest_space)

        origin_resource_hub = resource_hub_fixture(ctx.creator, origin_space)
        dest_resource_hub = resource_hub_fixture(ctx.creator, dest_space)

        folder = folder_fixture(origin_resource_hub.id)

        assert {code, res} = mutation(ctx.conn, :copy_resource_hub_folder, %{
          folder_id: Paths.folder_id(folder),
          dest_resource_hub_id: Paths.resource_hub_id(dest_resource_hub),
          dest_parent_folder_id: nil,
        })
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert res.folder_id
            assert ResourceHubs.count_children(dest_resource_hub) == 1
          403 ->
            assert ResourceHubs.count_children(dest_resource_hub) == 0
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert ResourceHubs.count_children(dest_resource_hub) == 0
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:doc, :hub, folder: :folder)
      |> Factory.add_file(:file1, :hub, folder: :folder)
      |> Factory.add_link(:link, :hub, folder: :folder)
      |> Factory.preload(:folder, :node)
      |> Factory.preload(:doc, :node)
      |> Factory.preload(:file1, :node)
      |> Factory.preload(:link, :node)
    end

    test "creates a copy of folder", ctx do
      assert ResourceHubs.count_children(ctx.hub) == 4
      assert ResourceHubs.count_children(ctx.folder) == 3

      assert {200, res} = mutation(ctx.conn, :copy_resource_hub_folder, %{
        folder_id: Paths.folder_id(ctx.folder),
        dest_resource_hub_id: Paths.resource_hub_id(ctx.hub),
        dest_parent_folder_id: nil,
      })

      assert ResourceHubs.count_children(ctx.hub) == 8
      assert ResourceHubs.count_children(ctx.folder) == 3

      assert_folder_copied(ctx, res.folder_id)
    end

    test "copies folder into another parent folder", ctx do
      ctx = Factory.add_folder(ctx, :parent_folder, :hub)

      assert ResourceHubs.count_children(ctx.hub) == 5
      assert ResourceHubs.count_children(ctx.parent_folder) == 0
      assert ResourceHubs.count_children(ctx.folder) == 3

      assert {200, res} = mutation(ctx.conn, :copy_resource_hub_folder, %{
        folder_id: Paths.folder_id(ctx.folder),
        dest_resource_hub_id: Paths.resource_hub_id(ctx.hub),
        dest_parent_folder_id: Paths.folder_id(ctx.parent_folder),
      })

      assert ResourceHubs.count_children(ctx.hub) == 9
      assert ResourceHubs.count_children(ctx.parent_folder) == 1
      assert ResourceHubs.count_children(ctx.folder) == 3

      assert_folder_copied(ctx, res.folder_id)

      # copied folder doesn't have parent
      assert ctx.folder.node.parent_folder_id == nil

      # new folder has parent
      new_folder = fetch_folder(res.folder_id)
      assert new_folder.node.parent_folder_id == ctx.parent_folder.id
    end

    test "copied folder into resource hub in another space", ctx do
      ctx =
        ctx
        |> Factory.add_space(:another_space)
        |> Factory.add_resource_hub(:another_hub, :another_space, :creator)

      assert ResourceHubs.count_children(ctx.hub) == 4
      assert ResourceHubs.count_children(ctx.another_hub) == 0
      assert ResourceHubs.count_children(ctx.folder) == 3

      assert {200, res} = mutation(ctx.conn, :copy_resource_hub_folder, %{
        folder_id: Paths.folder_id(ctx.folder),
        dest_resource_hub_id: Paths.resource_hub_id(ctx.another_hub),
        dest_parent_folder_id: nil,
      })

      assert ResourceHubs.count_children(ctx.hub) == 4
      assert ResourceHubs.count_children(ctx.another_hub) == 4
      assert ResourceHubs.count_children(ctx.folder) == 3

      assert_folder_copied(ctx, res.folder_id)
    end
  end

  #
  # Steps
  #

  defp fetch_folder(short_id) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(short_id)
    {:ok, folder} = ResourceHubs.Folder.get(:system, id: id, opts: [preload: :node])
    folder
  end

  defp assert_folder_copied(ctx, new_folder_id) do
    new_folder = fetch_folder(new_folder_id)

    assert ResourceHubs.count_children(new_folder) == 3

    new_document = ResourceHubs.list_documents(new_folder) |> hd()
    assert_document_created(ctx.doc, new_document)

    new_link = ResourceHubs.list_links(new_folder) |> hd()
    assert_link_created(ctx.link, new_link)

    new_file = ResourceHubs.list_files(new_folder) |> hd()
    assert_file_created(ctx.file1, new_file)
  end

  defp assert_document_created(document, new_document) do
    refute document.node.id == new_document.node.id
    assert document.node.name == new_document.node.name
    assert new_document.node.type == :document

    refute document.id == new_document.id
    assert document.content == new_document.content
  end

  defp assert_link_created(link, new_link) do
    refute link.node.id == new_link.node.id
    assert link.node.name == new_link.node.name
    assert new_link.node.type == :link

    refute link.id == new_link.id
    assert link.url == new_link.url
    assert link.type == new_link.type
    assert link.description == new_link.description
  end

  defp assert_file_created(file, new_file) do
    refute file.node.id == new_file.node.id
    assert file.node.name == new_file.node.name
    assert new_file.node.type == :file

    refute file.id == new_file.id
    assert file.description == new_file.description
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
