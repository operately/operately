defmodule OperatelyWeb.Api.Queries.GetResourceHubDocumentTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_resource_hub_document, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
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
        doc = document_fixture(resource_hub.id, ctx.creator.id)

        assert {code, res} = query(ctx.conn, :get_resource_hub_document, %{id: Paths.document_id(doc)})

        assert code == @test.expected

        case @test.expected do
          404 ->
            assert res.message == "The requested resource was not found"
          200 ->
            assert res.document.id == Paths.document_id(doc)
        end
      end
    end
  end

  describe "get_resource_hub_document functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:doc, :hub, folder: :folder)
    end

    test "get document", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_document, %{id: Paths.document_id(ctx.doc)})

      assert res.document.id == Paths.document_id(ctx.doc)
    end

    test "include_author", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_document, %{id: Paths.document_id(ctx.doc)})

      refute res.document.author

      assert {200, res} = query(ctx.conn, :get_resource_hub_document, %{
        id: Paths.document_id(ctx.doc),
        include_author: true
      })

      assert res.document.author == Serializer.serialize(ctx.creator)
    end

    test "include_resource_hub", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_document, %{id: Paths.document_id(ctx.doc)})

      refute res.document.resource_hub

      assert {200, res} = query(ctx.conn, :get_resource_hub_document, %{
        id: Paths.document_id(ctx.doc),
        include_resource_hub: true,
      })

      assert res.document.resource_hub == Serializer.serialize(ctx.hub)
    end

    test "include_parent_folder", ctx do
      assert {200, res} = query(ctx.conn, :get_resource_hub_document, %{id: Paths.document_id(ctx.doc)})

      refute res.document.parent_folder

      assert {200, res} = query(ctx.conn, :get_resource_hub_document, %{
        id: Paths.document_id(ctx.doc),
        include_parent_folder: true,
      })

      assert res.document.parent_folder == Repo.preload(ctx.folder, :node) |> Serializer.serialize()
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
