defmodule OperatelyWeb.Api.Mutations.CreateResourceHubTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures

  alias Operately.ResourceHubs
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_resource_hub, %{})
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
        space = create_space(ctx, @test.company)

        if @test.space != :no_access do
          {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
            id: ctx.person.id,
            access_level: Binding.from_atom(@test.space)
          }])
        end

        assert {code, res} = mutation(ctx.conn, :create_resource_hub, %{
          space_id: Paths.space_id(space),
          name: "Resource Hub",
          description: RichText.rich_text("description", :as_string),
          anonymous_access_level: Binding.no_access(),
          company_access_level: Binding.view_access(),
          space_access_level: Binding.edit_access()
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            hubs = ResourceHubs.list_resource_hubs(space)
            assert length(hubs) == 2
          403 ->
            assert length(ResourceHubs.list_resource_hubs(space)) == 1
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert length(ResourceHubs.list_resource_hubs(space)) == 1
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
    end

    test "creates resource hub", ctx do
      assert length(ResourceHubs.list_resource_hubs(ctx.space)) == 1

      assert {200, res} = mutation(ctx.conn, :create_resource_hub, %{
        space_id: Paths.space_id(ctx.space),
        name: "Resource Hub",
        description: RichText.rich_text("description", :as_string),
        anonymous_access_level: Binding.no_access(),
        company_access_level: Binding.view_access(),
        space_access_level: Binding.edit_access()
      })

      hubs = ResourceHubs.list_resource_hubs(ctx.space)

      assert length(hubs) == 2
      assert Enum.find(hubs, &(Serializer.serialize(&1) == res.resource_hub))
    end
  end

  #
  # Helpers
  #

  def create_space(ctx, company_permissions) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.from_atom(company_permissions)})
  end
end
