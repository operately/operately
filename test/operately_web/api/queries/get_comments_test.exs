defmodule OperatelyWeb.Api.Queries.GetCommentsTest do
  use OperatelyWeb.TurboCase

  import OperatelyWeb.Api.Serializer
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  # import Operately.UpdatesFixtures
  import Operately.ProjectsFixtures

  alias Operately.Repo
  alias Operately.Support.RichText
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_comments, %{})
    end
  end

  describe "permissions - project check-in" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space: space})
    end

    test "company members have no access", ctx do
      check_in = create_check_in(ctx, company_access: Binding.no_access())
      Enum.each(1..3, fn _ ->
        add_comment(ctx, check_in.id, "project_check_in")
      end)

      assert {200, res} = query(ctx.conn, :get_comments, %{
        entity_id: Paths.project_check_in_id(check_in),
        entity_type: "project_check_in",
      })
      assert length(res.comments) == 0
    end

    test "company members have access", ctx do
      check_in = create_check_in(ctx, company_access: Binding.view_access())
      comments = Enum.map(1..3, fn _ ->
        add_comment(ctx, check_in.id, "project_check_in")
      end)

      assert {200, res} = query(ctx.conn, :get_comments, %{
        entity_id: Paths.project_check_in_id(check_in),
        entity_type: "project_check_in",
      })
      assert_comments(res, comments)
    end

    test "space members have no access", ctx do
      add_person_to_space(ctx)
      check_in = create_check_in(ctx, space_access: Binding.no_access())
      Enum.each(1..3, fn _ ->
        add_comment(ctx, check_in.id, "project_check_in")
      end)

      assert {200, res} = query(ctx.conn, :get_comments, %{
        entity_id: Paths.project_check_in_id(check_in),
        entity_type: "project_check_in",
      })
      assert length(res.comments) == 0
    end

    test "space members have access", ctx do
      add_person_to_space(ctx)
      check_in = create_check_in(ctx, space_access: Binding.view_access())
      comments = Enum.map(1..3, fn _ ->
        add_comment(ctx, check_in.id, "project_check_in")
      end)

      assert {200, res} = query(ctx.conn, :get_comments, %{
        entity_id: Paths.project_check_in_id(check_in),
        entity_type: "project_check_in",
      })
      assert_comments(res, comments)
    end

    test "champions have access", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      check_in = create_check_in(ctx, champion_id: champion.id)
      comments = Enum.map(1..3, fn _ ->
        add_comment(ctx, check_in.id, "project_check_in")
      end)

      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      # champion's request
      assert {200, res} = query(conn, :get_comments, %{
        entity_id: Paths.project_check_in_id(check_in),
        entity_type: "project_check_in",
      })
      assert_comments(res, comments)

      # another user's request
      assert {200, res} = query(ctx.conn, :get_comments, %{
        entity_id: Paths.project_check_in_id(check_in),
        entity_type: "project_check_in",
      })
      assert length(res.comments) == 0
    end

    test "reviewers have access", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      check_in = create_check_in(ctx, reviewer_id: reviewer.id)
      comments = Enum.map(1..3, fn _ ->
        add_comment(ctx, check_in.id, "project_check_in")
      end)

      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      # reviewer's request
      assert {200, res} = query(conn, :get_comments, %{
        entity_id: Paths.project_check_in_id(check_in),
        entity_type: "project_check_in",
      })
      assert_comments(res, comments)

      # another user's request
      assert {200, res} = query(ctx.conn, :get_comments, %{
        entity_id: Paths.project_check_in_id(check_in),
        entity_type: "project_check_in",
      })
      assert length(res.comments) == 0
    end
  end

  #
  # Helpers
  #

  defp assert_comments(res, comments) do
    assert length(res.comments) == length(comments)
    assert Enum.each(res.comments, fn c ->
      Enum.find(comments, &(&1 == c))
    end)
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      permissions: Binding.edit_access(),
    }])
  end

  defp create_check_in(ctx, opts) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      group_id: ctx.space.id,
      creator_id: ctx.creator.id,
      champion_id: Keyword.get(opts, :champion_id, ctx.creator.id),
      reviewer_id: Keyword.get(opts, :reviewer_id, ctx.creator.id),
      company_access_level: Keyword.get(opts, :company_access, Binding.no_access()),
      space_access_level: Keyword.get(opts, :space_access, Binding.no_access()),
    })

    check_in_fixture(%{author_id: ctx.creator.id, project_id: project.id})
  end

  defp create_discussion(ctx, attrs) do
    update_fixture(%{
      author_id: ctx.creator.id,
      updatable_id: Keyword.get(attrs, :space_id, ctx.company.company_space_id),
      updatable_type: :space,
      type: :project_discussion,
      content: %{
        title: "Hello World",
        body: "How are you doing?"
      }
    })
  end

  defp add_comment(ctx, entity_id, entity_type, content \\ "Hello World") do
    {:ok, comment} = Operately.Operations.CommentAdding.run(ctx.person, entity_id, entity_type, RichText.rich_text(content))
    Repo.preload(comment, :author)
    |> serialize(level: :full)
  end
end
