defmodule OperatelyWeb.Api.Mutations.EditResourceHubLinkTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Support.RichText

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_resource_hub_link, %{})
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
        link = link_fixture(resource_hub, ctx.creator)

        assert {code, res} = mutation(ctx.conn, :edit_resource_hub_link, %{
          link_id: Paths.link_id(link),
          name: "New name",
          type: "google_doc",
          url: "http://localhost:3000",
          description: RichText.rich_text("Brand new description", :as_string)
        })
        assert code == @test.expected

        link = Repo.reload(link)

        case @test.expected do
          200 ->
            assert link.description == RichText.rich_text("Brand new description")
            assert res.link.id == Paths.link_id(link)
          403 ->
            assert link.description == RichText.rich_text("Description")
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert link.description == RichText.rich_text("Description")
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
      |> Factory.add_link(:link, :hub)
      |> Factory.preload(:link, :node)
    end

    test "edits link", ctx do
      assert ctx.link.node.name === "Link"
      assert ctx.link.type === :other
      assert ctx.link.url === "http://localhost:4000"
      assert ctx.link.description === RichText.rich_text("Description")

      assert {200, _} = mutation(ctx.conn, :edit_resource_hub_link, %{
        link_id: Paths.link_id(ctx.link),
        name: "New name",
        type: "google_doc",
        url: "http://localhost:3000",
        description: RichText.rich_text("Brand new description", :as_string)
      })

      node = Repo.reload(ctx.link.node)
      link = Repo.reload(ctx.link)

      assert node.name === "New name"
      assert link.type === :google_doc
      assert link.url === "http://localhost:3000"
      assert link.description === RichText.rich_text("Brand new description")
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
