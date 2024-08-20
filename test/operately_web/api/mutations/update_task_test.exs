defmodule OperatelyWeb.Api.Mutations.UpdateTaskTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :update_task, %{})
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
        milestone = create_milestone(ctx, project)
        task = create_task(ctx, milestone)

        assert {code, res} = mutation(ctx.conn, :update_task, %{
          task_id: Paths.task_id(task), 
          name: "New name",
          assigned_ids: [Paths.person_id(ctx.person)]
        })

        assert code == @test.expected
        task = Operately.Tasks.get_task!(task.id)

        case @test.expected do
          200 -> assert res == %{task: Serializer.serialize(task, level: :essential)}
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end

        if @test.expected != 200 do
          assert task.name == "Example task"
        end
      end
    end
  end

  #
  # Helpers
  #
    
  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  def create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      name: "Name",
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id, 
        permissions: Binding.from_atom(space_members_level)
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

  def create_milestone(ctx, project) do
    milestone_fixture(ctx.creator, %{project_id: project.id})
  end

  def create_task(ctx, milestone) do
    task_fixture(%{creator_id: ctx.creator.id, milestone_id: milestone.id, name: "Example task"})
  end
end 
