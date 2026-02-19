defmodule OperatelyWeb.Api.Queries.GetMilestoneTest do
  use OperatelyWeb.TurboCase

  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Access.Binding
  alias Operately.Support.RichText

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_milestone, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space, space_id: space.id, creator: creator})
    end

    test "company members have no access", ctx do
      m = create_milestone(ctx, company_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, :get_milestone, %{id: m.id})
      assert res.message == "The requested resource was not found"
    end

    test "company members have access", ctx do
      m = create_milestone(ctx, company_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_milestone, %{id: m.id})
      assert_response(res, m)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      m = create_milestone(ctx, space_access: Binding.no_access())

      assert {404, res} = query(ctx.conn, :get_milestone, %{id: m.id})
      assert res.message == "The requested resource was not found"
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      m = create_milestone(ctx, space_access: Binding.view_access())

      assert {200, res} = query(ctx.conn, :get_milestone, %{id: m.id})
      assert_response(res, m)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      m = create_milestone(ctx, champion_id: champion.id)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_milestone, %{id: m.id})
      assert_response(res, m)

      # another user's request
      assert {404, res} = query(ctx.conn, :get_milestone, %{id: m.id})
      assert res.message == "The requested resource was not found"
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      m = create_milestone(ctx, reviewer_id: reviewer.id)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = query(conn, :get_milestone, %{id: m.id})
      assert_response(res, m)

      # another user's request
      assert {404, res} = query(ctx.conn, :get_milestone, %{id: m.id})
      assert res.message == "The requested resource was not found"
    end
  end


  describe "get_milestone functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
    end

    test "include_project", ctx do
      assert {200, res} = query(ctx.conn, :get_milestone, %{id: Paths.milestone_id(ctx.milestone)})

      refute res.milestone.project

      assert {200, res} = query(ctx.conn, :get_milestone, %{
        id: Paths.milestone_id(ctx.milestone),
        include_project: true,
      })

      assert res.milestone.project.id == Paths.project_id(ctx.project)
    end

    test "include_permissions", ctx do
      assert {200, res} = query(ctx.conn, :get_milestone, %{id: Paths.milestone_id(ctx.milestone)})

      refute res.milestone.permissions

      assert {200, res} = query(ctx.conn, :get_milestone, %{
        id: Paths.milestone_id(ctx.milestone),
        include_permissions: true,
      })

      assert res.milestone.permissions.can_edit
    end

    test "include_comments", ctx do
      person = person_fixture(%{company_id: ctx.company.id})
      Operately.Comments.create_milestone_comment(person, ctx.milestone, "none", %{
        content: %{"message" => RichText.rich_text("some message")},
        author_id: person.id,
      })

      assert {200, res} = query(ctx.conn, :get_milestone, %{id: Paths.milestone_id(ctx.milestone)})

      refute res.milestone.comments

      assert {200, res} = query(ctx.conn, :get_milestone, %{
        id: Paths.milestone_id(ctx.milestone),
        include_comments: true,
      })

      assert length(res.milestone.comments) == 1

      comment = hd(res.milestone.comments)

      assert comment.action == "none"
      assert comment.comment.author
      assert comment.comment.content
      assert comment.comment.notification
      assert comment.comment.notification.read == false
    end
  end

  #
  # Helpers
  #

  defp assert_response(res, milestone) do
    m = %{res.milestone | status: to_string(res.milestone.status)}
    assert milestone == m
  end

  defp create_milestone(ctx, opts) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      name: "Project",
      creator_id: ctx.creator.id,
      champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
      reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
      group_id: Keyword.get(opts, :space_id, ctx.space.id),
      company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access, Binding.no_access()),
    })

    milestone_fixture(%{ project_id: project.id })
    |> Serializer.serialize(level: :essential)
    |> Jason.encode!()
    |> Jason.decode!(keys: :atoms)
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end
end
