defmodule OperatelyWeb.Api.Mutations.DeleteSpaceTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query
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
    setup ctx do
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},
      %{company: :no_access,      space: :comment_access, expected: 403},
      %{company: :no_access,      space: :edit_access,    expected: 403},
      %{company: :no_access,      space: :full_access,    expected: 200},

      %{company: :comment_access, space: :no_access,      expected: 403},
      %{company: :comment_access, space: :comment_access, expected: 403},
      %{company: :comment_access, space: :edit_access,    expected: 403},
      %{company: :comment_access, space: :full_access,    expected: 200},

      %{company: :edit_access,    space: :no_access,      expected: 403},
      %{company: :edit_access,    space: :comment_access, expected: 403},
      %{company: :edit_access,    space: :edit_access,    expected: 403},
      %{company: :edit_access,    space: :full_access,    expected: 200},

      %{company: :full_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :comment_access, expected: 200},
      %{company: :full_access,    space: :edit_access,    expected: 200},
      %{company: :full_access,    space: :full_access,    expected: 200},
    ]

    tabletest @table do
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
    setup ctx do
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.log_in_person(:person)
    end

    test "deletes space successfully", ctx do
      space = create_space(ctx, :full_access, :full_access)

      assert {200, _} = mutation(ctx.conn, :delete_space, %{
        space_id: Paths.space_id(space),
      })

      # Verify space is deleted
      {:error, :not_found} = Group.get(:system, id: space.id)
    end

    test "deletes empty space without sub-resources", ctx do
      space = create_space(ctx, :full_access, :full_access)

      # Verify space has no projects or goals
      assert Operately.Repo.all(from p in Operately.Projects.Project, where: p.group_id == ^space.id) == []
      assert Operately.Repo.all(from g in Operately.Goals.Goal, where: g.group_id == ^space.id) == []

      assert {200, _} = mutation(ctx.conn, :delete_space, %{
        space_id: Paths.space_id(space),
      })

      # Verify space is deleted
      {:error, :not_found} = Group.get(:system, id: space.id)
    end

    test "returns an error when deleting the general space", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      {:ok, general_space} = Group.get(:system, id: ctx.company.company_space_id)

      assert {400, res} = mutation(ctx.conn, :delete_space, %{space_id: Paths.space_id(general_space)})
      assert res.message == "You cannot delete the general space"

      {:ok, _} = Group.get(:system, id: general_space.id)
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
