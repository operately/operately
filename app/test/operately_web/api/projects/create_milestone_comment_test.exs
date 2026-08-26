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
        assert comment.comment.content == (@test.result || %{})
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

  describe "completing a milestone with open tasks" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:open_task, :milestone)
    end

    test "requires an open task resolution", ctx do
      assert {400, res} = complete_milestone(ctx)
      assert res.message == "Choose what happens to the open tasks before completing the milestone"

      assert Operately.Repo.reload!(ctx.milestone).status == :pending
      assert Operately.Repo.reload!(ctx.open_task).milestone_id == ctx.milestone.id
    end

    test "moves open tasks outside the milestone", ctx do
      assert {200, _} = complete_milestone(ctx, %{action: "move_to_no_milestone"})

      assert Operately.Repo.reload!(ctx.milestone).status == :done
      assert Operately.Repo.reload!(ctx.open_task).milestone_id == nil
    end

    test "does not move tasks that are already closed", ctx do
      closed_status = Enum.find(ctx.project.task_statuses, &(&1.closed && &1.color == :green))

      ctx =
        Factory.add_project_task(ctx, :closed_task, :milestone,
          task_status: Map.from_struct(closed_status),
          closed_at: NaiveDateTime.utc_now()
        )

      assert {200, _} = complete_milestone(ctx, %{action: "move_to_no_milestone"})

      assert Operately.Repo.reload!(ctx.open_task).milestone_id == nil
      assert Operately.Repo.reload!(ctx.closed_task).milestone_id == ctx.milestone.id
    end

    test "changes open tasks to a selected closed status", ctx do
      closed_status = Enum.find(ctx.project.task_statuses, &(&1.closed && &1.color == :green))

      assert {200, _} = complete_milestone(ctx, %{action: "set_status", status_id: closed_status.id})

      task = Operately.Repo.reload!(ctx.open_task)
      assert task.milestone_id == ctx.milestone.id
      assert task.task_status.id == closed_status.id
      assert task.task_status.closed
      assert task.status == closed_status.value
      assert task.closed_at
      refute task.reopened_at
    end

    test "refreshes assignment counts for assignees of closed tasks", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:assignee)
        |> Factory.add_project_task(:second_open_task, :milestone)
        |> Factory.add_task_assignee(:task_assignee, :open_task, :assignee)
        |> Factory.add_task_assignee(:second_task_assignee, :second_open_task, :assignee)

      topic = "api:assignments_count:#{ctx.assignee.id}"
      OperatelyWeb.Endpoint.subscribe(topic)

      closed_status = Enum.find(ctx.project.task_statuses, &(&1.closed && &1.color == :green))

      assert {200, _} = complete_milestone(ctx, %{action: "set_status", status_id: closed_status.id})

      assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event", payload: %{}}
      refute_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "event", payload: %{}}
    end

    test "rejects an open task status", ctx do
      open_status = Enum.find(ctx.project.task_statuses, &(!&1.closed))

      assert {400, res} = complete_milestone(ctx, %{action: "set_status", status_id: open_status.id})
      assert res.message == "Select a closed task status"

      refute Operately.Repo.reload!(ctx.open_task).task_status.closed
      assert Operately.Repo.reload!(ctx.milestone).status == :pending
    end
  end

  #
  # Helpers
  #

  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp complete_milestone(ctx, resolution \\ nil) do
    inputs = %{
      milestone_id: Paths.milestone_id(ctx.milestone),
      content: nil,
      action: "complete"
    }

    inputs = if resolution, do: Map.put(inputs, :open_tasks_resolution, resolution), else: inputs

    mutation(ctx.conn, [:projects, :create_milestone_comment], inputs)
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
