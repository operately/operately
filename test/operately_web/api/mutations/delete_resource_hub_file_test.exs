defmodule OperatelyWeb.Api.Mutations.DeleteResourceHubFileTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs.File
  alias Operately.Access.Binding

  import Operately.GroupsFixtures
  import Operately.ResourceHubsFixtures

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :delete_resource_hub_file, %{})
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

        assert {code, res} = mutation(ctx.conn, :delete_resource_hub_file, %{
          file_id: Paths.file_id(file),
        })
        assert code == @test.expected

        case @test.expected do
          200 ->
            {:error, :not_found} = File.get(:system, id: file.id)
          403 ->
            {:ok, _} = File.get(:system, id: file.id)
            assert res.message == "You don't have permission to perform this action"
          404 ->
            {:ok, _} = File.get(:system, id: file.id)
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
    end

    test "removes file", ctx do
      assert {200, res} = mutation(ctx.conn, :delete_resource_hub_file, %{
        file_id: Paths.file_id(ctx.my_file),
      })

      assert res.file.id == Paths.file_id(ctx.my_file)

      {:error, :not_found} = File.get(:system, id: ctx.my_file.id)
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
