defmodule OperatelyWeb.Api.Mutations.EditResourceHubFileTest do
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
      assert {401, _} = mutation(ctx.conn, :edit_resource_hub_file, %{})
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
        file = file_fixture(resource_hub, ctx.creator)

        assert {code, res} = mutation(ctx.conn, :edit_resource_hub_file, %{
          file_id: Paths.file_id(file),
          name: "Edited name",
          description: RichText.rich_text("Edited content", :as_string)
        })
        assert code == @test.expected

        file = Repo.reload(file)

        case @test.expected do
          200 ->
            assert file.description == RichText.rich_text("Edited content")
            assert res.file.id == Paths.file_id(file)
          403 ->
            assert file.description == RichText.rich_text("Content")
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert file.description == RichText.rich_text("Content")
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
      |> Factory.add_file(:my_file, :hub)
      |> Factory.preload(:my_file, :node)
    end

    test "edits file", ctx do
      assert ctx.my_file.node.name === "some name"
      assert ctx.my_file.description === RichText.rich_text("Content")

      assert {200, _} = mutation(ctx.conn, :edit_resource_hub_file, %{
        file_id: Paths.file_id(ctx.my_file),
        name: "New name",
        description: RichText.rich_text("Edited content", :as_string)
      })

      node = Repo.reload(ctx.my_file.node)
      file = Repo.reload(ctx.my_file)

      assert node.name === "New name"
      assert file.description === RichText.rich_text("Edited content")
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
