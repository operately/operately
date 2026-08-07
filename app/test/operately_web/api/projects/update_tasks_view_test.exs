defmodule OperatelyWeb.Api.Projects.UpdateTasksViewTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding
  alias OperatelyWeb.Api.Serializer

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :update_tasks_view], %{})
    end
  end

  describe "permissions" do
    @table [
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

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)

        assert {code, res} = request(ctx.conn, project)
        assert code == @test.expected

        case @test.expected do
          200 -> assert_tasks_view_updated(res, project)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "update_tasks_view functionality" do
    setup :register_and_log_in_account

    test "updates the shared tasks view", ctx do
      project = create_project(ctx)

      assert project.tasks_view == :list

      assert {200, res} = request(ctx.conn, project)
      assert_tasks_view_updated(res, project)
    end

    test "persists board view for subsequent loads", ctx do
      project = create_project(ctx)

      assert {200, _} = request(ctx.conn, project, "board")

      project = Repo.reload(project)
      assert project.tasks_view == :board
      assert Serializer.serialize(project, level: :full).tasks_view == "board"
    end
  end

  #
  # Steps
  #

  defp request(conn, project, tasks_view \\ "board") do
    mutation(conn, [:projects, :update_tasks_view], %{
      project_id: Paths.project_id(project),
      tasks_view: tasks_view,
    })
  end

  defp assert_tasks_view_updated(res, project) do
    project = Repo.reload(project)

    assert project.tasks_view == :board
    assert res.project.tasks_view == "board"
  end

  #
  # Helpers
  #

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_project(ctx, space, company_level, space_level, project_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      name: "Name",
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_level),
      space_access_level: Binding.from_atom(space_level),
    })

    if space_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_level)
      }])
    end

    if project_level != :no_access do
      {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
        project_id: project.id,
        person_id: ctx.person.id,
        permissions: Binding.from_atom(project_level),
        responsibility: "some responsibility"
      })
    end

    project
  end

  defp create_project(ctx, attrs \\ []) do
    project_fixture(Enum.into(attrs, %{
      company_id: ctx.company.id,
      name: "Name",
      creator_id: ctx[:creator_id] || ctx.person.id,
      group_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }))
  end
end
