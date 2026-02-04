defmodule OperatelyWeb.Api.Mutations.TasksPermissionsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.Access.Binding
  alias Operately.ProjectsFixtures
  alias Operately.Support.RichText

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

  @space_table [
    %{company: :no_access,      space: :no_access,      expected: 404},
    %{company: :no_access,      space: :comment_access, expected: 403},
    %{company: :no_access,      space: :edit_access,    expected: 200},
    %{company: :no_access,      space: :full_access,    expected: 200},

    %{company: :comment_access, space: :no_access,      expected: 403},
    %{company: :edit_access,    space: :no_access,      expected: 200},
    %{company: :full_access,    space: :no_access,      expected: 200},
  ]

  setup ctx do
    ctx = register_and_log_in_account(ctx)
    creator = person_fixture(%{company_id: ctx.company.id})

    Map.merge(ctx, %{creator: creator})
  end

  describe "project task update_status permissions" do
    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_project_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_status], %{
          task_id: Paths.task_id(task),
          status: status_input(),
          type: "project"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "project task update_description permissions" do
    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_project_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_description], %{
          task_id: Paths.task_id(task),
          description: RichText.rich_text("Updated description", :as_string),
          type: "project"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "project task update_name permissions" do
    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_project_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_name], %{
          task_id: Paths.task_id(task),
          name: "Updated Name",
          type: "project"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "project task update_due_date permissions" do
    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_project_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_due_date], %{
          task_id: Paths.task_id(task),
          due_date: %{
            date: "2026-01-01",
            date_type: "day",
            value: "Jan 1, 2026"
          },
          type: "project"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "project task update_assignee permissions" do
    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_project_task_context(ctx, @test)
        assignee = person_fixture(%{company_id: ctx.company.id})

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_assignee], %{
          task_id: Paths.task_id(task),
          assignee_id: Paths.person_id(assignee),
          type: "project"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "project task update_milestone_and_ordering permissions" do
    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        %{milestone: milestone, task: task} = create_project_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_milestone_and_ordering], %{
          task_id: Paths.task_id(task),
          milestone_id: Paths.milestone_id(milestone),
          milestones_ordering_state: [
            %{
              milestone_id: Paths.milestone_id(milestone),
              ordering_state: [Paths.task_id(task)]
            }
          ]
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "project task update_milestone permissions" do
    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        %{project: project, task: task} = create_project_task_context(ctx, @test)
        milestone = ProjectsFixtures.milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_milestone], %{
          task_id: Paths.task_id(task),
          milestone_id: Paths.milestone_id(milestone)
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "project task create permissions" do
    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_project_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = ProjectsFixtures.milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})

        assert {code, res} = mutation(ctx.conn, [:tasks, :create], %{
          id: Paths.project_id(project),
          type: "project",
          milestone_id: Paths.milestone_id(milestone),
          name: "Project Task",
          assignee_id: nil,
          due_date: nil
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Project not found"
        end
      end
    end
  end

  describe "project task delete permissions" do
    tabletest @project_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_project_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :delete], %{
          task_id: Paths.task_id(task),
          type: "project"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "space task update_status permissions" do
    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_space_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_status], %{
          task_id: Paths.task_id(task),
          status: status_input(),
          type: "space"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "space task update_description permissions" do
    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_space_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_description], %{
          task_id: Paths.task_id(task),
          description: RichText.rich_text("Updated description", :as_string),
          type: "space"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "space task update_name permissions" do
    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_space_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_name], %{
          task_id: Paths.task_id(task),
          name: "Updated Name",
          type: "space"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "space task update_due_date permissions" do
    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_space_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_due_date], %{
          task_id: Paths.task_id(task),
          due_date: %{
            date: "2026-01-01",
            date_type: "day",
            value: "Jan 1, 2026"
          },
          type: "space"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "space task update_assignee permissions" do
    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_space_task_context(ctx, @test)
        assignee = person_fixture(%{company_id: ctx.company.id})

        assert {code, res} = mutation(ctx.conn, [:tasks, :update_assignee], %{
          task_id: Paths.task_id(task),
          assignee_id: Paths.person_id(assignee),
          type: "space"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  describe "space task create permissions" do
    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        space = create_space_with_permissions(ctx, @test.company, @test.space)

        assert {code, res} = mutation(ctx.conn, [:tasks, :create], %{
          id: Paths.space_id(space),
          type: "space",
          name: "Space Task",
          assignee_id: nil,
          due_date: nil
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert Map.has_key?(res, :task)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Space not found"
        end
      end
    end
  end

  describe "space task delete permissions" do
    tabletest @space_table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        %{task: task} = create_space_task_context(ctx, @test)

        assert {code, res} = mutation(ctx.conn, [:tasks, :delete], %{
          task_id: Paths.task_id(task),
          type: "space"
        })
        assert code == @test.expected

        case @test.expected do
          200 -> assert res.success == true
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "Task not found"
        end
      end
    end
  end

  defp create_project_space(ctx) do
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

  defp create_project_task_context(ctx, test) do
    space = create_project_space(ctx)
    project = create_project(ctx, space, test.company, test.space, test.project)
    milestone = ProjectsFixtures.milestone_fixture(%{project_id: project.id, creator_id: ctx.creator.id})
    task = task_fixture(%{project_id: project.id, milestone_id: milestone.id, creator_id: ctx.creator.id})

    %{project: project, milestone: milestone, task: task}
  end

  defp create_space_with_permissions(ctx, company_level, space_level) do
    space = group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: Binding.from_atom(company_level)
    })

    if space_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_level)
      }])
    end

    space
  end

  defp create_space_task_context(ctx, test) do
    space = create_space_with_permissions(ctx, test.company, test.space)
    task = task_fixture(%{space_id: space.id, creator_id: ctx.creator.id})

    %{space: space, task: task}
  end

  defp status_input do
    %{
      id: "done",
      label: "Done",
      color: "green",
      index: 0,
      value: "done",
      closed: true
    }
  end
end
