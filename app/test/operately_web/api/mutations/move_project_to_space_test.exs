defmodule OperatelyWeb.Api.Mutations.MoveProjectToSpaceTest do
  use OperatelyWeb.TurboCase

  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :move_project_to_space, %{})
    end
  end

  describe "permissions" do
    @project_table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},
    ]

    @new_space_table [
      %{company: :no_access,      space: :no_access,      expected: 404},
      %{company: :no_access,      space: :comment_access, expected: 200},
      %{company: :no_access,      space: :edit_access,    expected: 200},
      %{company: :no_access,      space: :full_access,    expected: 200},

      %{company: :comment_access, space: :no_access,      expected: 200},
      %{company: :edit_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, creator: creator})
    end

    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        new_space = create_space(ctx, company_permissions: :view_access)
        project = create_project(ctx, @test.company, @test.space, @test.project)

        assert {code, res} = mutation(ctx.conn, :move_project_to_space, %{
          project_id: Paths.project_id(project),
          space_id: Paths.space_id(new_space)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert assert_space_changed(project, new_space)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    tabletest @new_space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the new space, then expect code=#{@test.expected}", ctx do
        new_space = create_space(ctx, company_permissions: @test.company)
        project = create_project(ctx, :full_access, :full_access, :full_access)

        if @test.space != :no_access do
          {:ok, _} = Operately.Groups.add_members(ctx.creator, new_space.id, [%{
            id: ctx.person.id,
            access_level: Binding.from_atom(@test.space)
          }])
        end

        assert {code, res} = mutation(ctx.conn, :move_project_to_space, %{
          project_id: Paths.project_id(project),
          space_id: Paths.space_id(new_space)
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert assert_space_changed(project, new_space)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "move_project_to_space functionality" do
    setup :register_and_log_in_account

    test "it moves a project to a space", ctx do
      project = project_fixture(%{
        company_id: ctx.company.id,
        group_id: ctx.company.company_space_id,
        creator_id: ctx.person.id
      })

      space = group_fixture(ctx.person, %{company_id: ctx.company.id})

      assert {200, %{}} = mutation(ctx.conn, :move_project_to_space, %{
        project_id: Paths.project_id(project),
        space_id: Paths.space_id(space)
      })

      assert_space_changed(project, space)
    end
  end

  defp assert_space_changed(project, space) do
    project = Repo.reload(project)
    assert project.group_id == space.id
  end

  #
  # Helpers
  #

  def create_space(ctx, company_permissions: permission) do
    group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: Binding.from_atom(permission),
    })
  end

  def create_project(ctx, company_members_level, space_members_level, project_member_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      group_id: ctx.space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    if project_member_level != :no_access do
      {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
        project_id: project.id,
        person_id: ctx.person.id,
        permissions: Binding.from_atom(project_member_level),
        responsibility: "some responsibility"
      })
    end

    project
  end
end
