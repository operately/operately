defmodule OperatelyWeb.Api.Mutations.EditResourceHubDocumentTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs.Document
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_resource_hub_document, %{})
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
        space = create_space(ctx)
        resource_hub = create_resource_hub(ctx, space, @test.company, @test.space)
        document = document_fixture(resource_hub.id, ctx.creator.id)

        assert {code, res} = mutation(ctx.conn, :edit_resource_hub_document, %{
          document_id: Paths.document_id(document),
          name: "Edited name",
          content: RichText.rich_text("Edited content", :as_string)
        })
        assert code == @test.expected

        {:ok, document} = Document.get(:system, id: document.id)

        case @test.expected do
          200 ->
            assert document.content == RichText.rich_text("Edited content")
            assert res.document.id == Paths.document_id(document)
          403 ->
            assert document.content == RichText.rich_text("Content")
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert document.content == RichText.rich_text("Content")
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.log_in_person(:creator)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub)
      |> Factory.preload(:document, :node)
    end

    test "edits document", ctx do
      assert ctx.document.node.name == "some name"
      assert ctx.document.content == RichText.rich_text("Content")

      assert {200, _} = mutation(ctx.conn, :edit_resource_hub_document, %{
        document_id: Paths.document_id(ctx.document),
        name: "Brand new name",
        content: RichText.rich_text("Edited content", :as_string)
      })

      {:ok, document} = Document.get(:system, id: ctx.document.id, opts: [preload: :node])

      assert document.node.name == "Brand new name"
      assert document.content == RichText.rich_text("Edited content")
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