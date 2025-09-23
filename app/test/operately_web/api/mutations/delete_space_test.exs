defmodule OperatelyWeb.Api.Mutations.DeleteSpaceTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures

  alias Operately.Groups.Group
  alias Operately.Access.Binding

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :delete_space, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},
      %{company: :no_access,      space: :comment_access, expected: 403},
      %{company: :no_access,      space: :edit_access,    expected: 403},
      %{company: :no_access,      space: :full_access,    expected: 200},
      
      %{company: :comment_access, space: :no_access,      expected: 404},
      %{company: :comment_access, space: :comment_access, expected: 403},
      %{company: :comment_access, space: :edit_access,    expected: 403},
      %{company: :comment_access, space: :full_access,    expected: 200},
      
      %{company: :edit_access,    space: :no_access,      expected: 404},
      %{company: :edit_access,    space: :comment_access, expected: 403},
      %{company: :edit_access,    space: :edit_access,    expected: 403},
      %{company: :edit_access,    space: :full_access,    expected: 200},
      
      %{company: :full_access,    space: :no_access,      expected: 404},
      %{company: :full_access,    space: :comment_access, expected: 403},
      %{company: :full_access,    space: :edit_access,    expected: 403},
      %{company: :full_access,    space: :full_access,    expected: 200},
    ]

    for @test <- @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, @test.company, @test.space)

        assert {code, res} = mutation(ctx.conn, :delete_space, %{
          space_id: Paths.space_id(space),
        })
        assert code == @test.expected

        case @test.expected do
          200 ->
            {:error, :not_found} = Group.get(:system, id: space.id)
          403 ->
            {:ok, _} = Group.get(:system, id: space.id)
            assert res.message == "You don't have permission to perform this action"
          404 ->
            {:ok, _} = Group.get(:system, id: space.id)
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "functionality" do
    test "deletes space and all sub-resources", ctx do
      space = create_space(ctx, :full_access, :full_access)
      
      # Add some sub-resources
      project = Factory.create(:project, %{group_id: space.id, creator_id: ctx.creator.id})
      goal = Factory.create(:goal, %{group_id: space.id, creator_id: ctx.creator.id})
      
      assert {200, _} = mutation(ctx.conn, :delete_space, %{
        space_id: Paths.space_id(space),
      })

      # Verify space is deleted
      {:error, :not_found} = Group.get(:system, id: space.id)
      
      # Verify sub-resources are cascade deleted
      assert Operately.Repo.get(Operately.Projects.Project, project.id) == nil
      assert Operately.Repo.get(Operately.Goals.Goal, goal.id) == nil
    end
  end

  #
  # Helpers
  #

  def create_space(ctx, company_members_level, space_members_level) do
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