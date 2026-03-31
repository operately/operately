defmodule OperatelyWeb.Api.Projects.CreateMilestoneCommentTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Comments
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:projects, :create_milestone_comment], %{})
    end
  end

  describe "permissions" do
    @table [
      %{action: "none",    company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{action: "none",    company: :no_access,      space: :no_access,      project: :view_access,    expected: 403},
      %{action: "none",    company: :no_access,      space: :no_access,      project: :comment_access, expected: 200},
      %{action: "none",    company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{action: "none",    company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{action: "none",    company: :no_access,      space: :view_access,    project: :no_access,      expected: 403},
      %{action: "none",    company: :no_access,      space: :comment_access, project: :no_access,      expected: 200},
      %{action: "none",    company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{action: "none",    company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{action: "none",    company: :view_access,    space: :no_access,      project: :no_access,      expected: 403},
      %{action: "none",    company: :comment_access, space: :no_access,      project: :no_access,      expected: 200},
      %{action: "none",    company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
      %{action: "none",    company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},

      %{action: "complete",    company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{action: "complete",    company: :no_access,      space: :no_access,      project: :view_access,    expected: 403},
      %{action: "complete",    company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{action: "complete",    company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{action: "complete",    company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{action: "complete",    company: :no_access,      space: :view_access,    project: :no_access,      expected: 403},
      %{action: "complete",    company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{action: "complete",    company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{action: "complete",    company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{action: "complete",    company: :view_access,    space: :no_access,      project: :no_access,      expected: 403},
      %{action: "complete",    company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
      %{action: "complete",    company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
      %{action: "complete",    company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},

      %{action: "reopen",    company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{action: "reopen",    company: :no_access,      space: :no_access,      project: :view_access,    expected: 403},
      %{action: "reopen",    company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{action: "reopen",    company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{action: "reopen",    company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{action: "reopen",    company: :no_access,      space: :view_access,    project: :no_access,      expected: 403},
      %{action: "reopen",    company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{action: "reopen",    company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{action: "reopen",    company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{action: "reopen",    company: :view_access,    space: :no_access,      project: :no_access,      expected: 403},
      %{action: "reopen",    company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
      %{action: "reopen",    company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
      %{action: "reopen",    company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if action=#{@test.action} and caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        milestone = milestone_fixture(%{project_id: project.id})

        assert {code, res} = mutation(ctx.conn, [:projects, :create_milestone_comment], %{
          milestone_id: Paths.milestone_id(milestone),
          content: RichText.rich_text("Content", :as_string),
          action: @test.action,
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert length(Comments.list_milestone_comments(milestone.id)) == 1
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "create_comment functionality" do
    @table [
      %{action: :complete, content: nil, result: nil},
      %{action: :reopen, content: nil, result: nil},
      %{action: :none, content: RichText.rich_text("Content", :as_string), result: RichText.rich_text("Content")},
    ]

    setup :register_and_log_in_account

    tabletest @table do
      test "post comment with action: #{@test.action}", ctx do
        project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
        milestone = milestone_fixture(%{project_id: project.id})

        assert Comments.list_milestone_comments(milestone.id) == []

        assert {200, _} = mutation(ctx.conn, [:projects, :create_milestone_comment], %{
          milestone_id: Paths.milestone_id(milestone),
          content: @test.content,
          action: Atom.to_string(@test.action),
        })

        comments = Comments.list_milestone_comments(milestone.id)
        assert length(comments) == 1

        comment = hd(comments)
        assert comment.action == @test.action
        assert comment.comment.content["message"] == @test.result
      end
    end

    test "doesn't create repeated subscriptions", ctx do
      mentioned_person = person_fixture(%{company_id: ctx.company.id})
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
      milestone = milestone_fixture(%{project_id: project.id})
      content = RichText.rich_text(mentioned_people: [mentioned_person])

      assert {200, _} = mutation(ctx.conn, [:projects, :create_milestone_comment], %{
        milestone_id: Paths.milestone_id(milestone),
        content: content,
        action: "none",
      })

      assert {200, _} = mutation(ctx.conn, [:projects, :create_milestone_comment], %{
        milestone_id: Paths.milestone_id(milestone),
        content: content,
        action: "none",
      })

      milestone = Operately.Repo.reload(milestone)

      assert subscription_count(milestone.subscription_list_id, ctx.person.id) == 1
      assert subscription_count(milestone.subscription_list_id, mentioned_person.id) == 1
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

  defp subscription_count(subscription_list_id, person_id) do
    query =
      from s in Operately.Notifications.Subscription,
        where: s.subscription_list_id == ^subscription_list_id and s.person_id == ^person_id

    Operately.Repo.aggregate(query, :count, :id)
  end
end
