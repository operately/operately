defmodule OperatelyWeb.Api.Mutations.ProjectMilestonesPermissionsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.Access.Binding
  alias Operately.ProjectsFixtures
  alias Operately.Support.RichText

  @edit_access_table [
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

  describe "update_kanban permissions" do
    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the milestone project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = ProjectsFixtures.milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})
        task = task_fixture(%{project_id: project.id, milestone_id: milestone.id, creator_id: ctx.creator.id})

        status_input = status_input(project)

        kanban_state = %{
          pending: [],
          in_progress: [Paths.task_id(task)],
          done: [],
          canceled: []
        }

        assert {code, res} = mutation(ctx.conn, [:project_milestones, :update_kanban], %{
          milestone_id: Paths.milestone_id(milestone),
          task_id: Paths.task_id(task),
          status: status_input,
          kanban_state: Jason.encode!(kanban_state)
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Milestone not found"
        end
      end
    end
  end

  describe "update_title permissions" do
    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the milestone project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = ProjectsFixtures.milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})

        assert {code, res} = mutation(ctx.conn, [:project_milestones, :update_title], %{
          milestone_id: Paths.milestone_id(milestone),
          title: "Updated Milestone"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :milestone)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Milestone not found"
        end
      end
    end
  end

  describe "update_description permissions" do
    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the milestone project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = ProjectsFixtures.milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})

        description = RichText.rich_text("Updated description")

        assert {code, res} = mutation(ctx.conn, [:project_milestones, :update_description], %{
          milestone_id: Paths.milestone_id(milestone),
          description: Jason.encode!(description)
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :milestone)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Milestone not found"
        end
      end
    end
  end

  describe "update_due_date permissions" do
    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the milestone project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = ProjectsFixtures.milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})

        contextual_date = %{
          date: "2026-01-01",
          date_type: "day",
          value: "Jan 1, 2026"
        }

        assert {code, res} = mutation(ctx.conn, [:project_milestones, :update_due_date], %{
          milestone_id: Paths.milestone_id(milestone),
          due_date: contextual_date
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :milestone)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Milestone not found"
        end
      end
    end
  end

  describe "delete permissions" do
    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the milestone project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = ProjectsFixtures.milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})

        assert {code, res} = mutation(ctx.conn, [:project_milestones, :delete], %{
          milestone_id: Paths.milestone_id(milestone)
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Milestone not found"
        end
      end
    end
  end

  describe "update_ordering permissions" do
    tabletest @edit_access_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = ProjectsFixtures.milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})

        assert {code, res} = mutation(ctx.conn, [:project_milestones, :update_ordering], %{
          project_id: Paths.project_id(project),
          ordering_state: [Paths.milestone_id(milestone)]
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :project)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Project not found"
        end
      end
    end
  end

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
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

  defp status_input(project) do
    project.task_statuses
    |> Enum.find(fn status -> status.value == "in_progress" end)
    |> then(fn status ->
      status
      |> Map.from_struct()
      |> Map.put(:color, to_string(status.color))
    end)
  end
end
