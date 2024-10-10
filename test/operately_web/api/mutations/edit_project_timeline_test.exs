defmodule OperatelyWeb.Api.Mutations.EditProjectTimelineTest do
  use OperatelyWeb.TurboCase

  alias Operately.Projects
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_project_timeline, %{})
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

        assert {code, res} = mutation(ctx.conn, :edit_project_timeline, %{
          project_id: Paths.project_id(project),
          project_due_date: Date.to_string(~D[2023-06-15]),
          project_start_date: Date.to_string(~D[2023-07-15]),
          milestone_updates: [],
          new_milestones: [],
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert res == %{project: Serializer.serialize(project)}
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "edit_project_timeline functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})

      Map.merge(ctx, %{project: project})
    end

    test "edits project start date and deadline", ctx do
      started_at = ~D[2023-06-15]
      deadline = ~D[2023-07-15]

      assert {200, res} = mutation(ctx.conn, :edit_project_timeline, %{
        project_id: Paths.project_id(ctx.project),
        project_due_date: Date.to_string(deadline),
        project_start_date: Date.to_string(started_at),
        milestone_updates: [],
        new_milestones: [],
      })

      project = Repo.reload(ctx.project)

      assert res.project == Serializer.serialize(project)
      assert DateTime.to_date(project.started_at) == started_at
      assert DateTime.to_date(project.deadline) == deadline
    end

    test "updates project milestones", ctx do
      milestone = milestone_fixture(ctx.person, %{project_id: ctx.project.id})

      assert {200, _} = mutation(ctx.conn, :edit_project_timeline, %{
        project_id: Paths.project_id(ctx.project),
        project_due_date: Date.to_string(~D[2023-06-15]),
        project_start_date: Date.to_string(~D[2023-07-15]),
        milestone_updates: [
          %{
            description: RichText.rich_text("New description", :as_string),
            due_time: Date.to_string(~D[2023-07-10]),
            id: Paths.milestone_id(milestone),
            title: "New title"
          }
        ],
        new_milestones: [],
      })

      milestone = Repo.reload(milestone)

      assert milestone.title == "New title"
      assert milestone.description == RichText.rich_text("New description")
    end

    test "adds project milestone", ctx do
      assert length(Projects.list_project_milestones(ctx.project)) == 0

      assert {200, _} = mutation(ctx.conn, :edit_project_timeline, %{
        project_id: Paths.project_id(ctx.project),
        project_due_date: Date.to_string(~D[2023-06-15]),
        project_start_date: Date.to_string(~D[2023-07-15]),
        milestone_updates: [],
        new_milestones: [
          %{
            description: RichText.rich_text("Description", :as_string),
            due_time: Date.to_string(~D[2023-07-10]),
            title: "Brand new milestone"
          }
        ],
      })

      milestones = Projects.list_project_milestones(ctx.project)

      assert length(milestones) == 1
      assert hd(milestones).title == "Brand new milestone"
      assert hd(milestones).description == RichText.rich_text("Description")
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
end
