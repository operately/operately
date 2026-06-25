defmodule OperatelyWeb.Mcp.Tools.Comments.CreateTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.People
  alias Operately.RichContent
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Comments.Create
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "creates comments for project resources" do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_project(:project, :space)
        |> Factory.add_project_discussion(:discussion, :project)
        |> Factory.add_project_check_in(:check_in, :project, :creator)
        |> Factory.add_project_milestone(:milestone, :project)
        |> Factory.add_project_task(:task, :milestone)

      conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator, ["mcp:read", "mcp:write"])

      assert_created_comment(conn, Paths.comment_thread_id(ctx.discussion), "project_discussion", "Comment on project discussion")
      assert_created_comment(conn, Paths.project_check_in_id(ctx.check_in), "project_check_in", "Comment on project check-in")
      assert_created_comment(conn, Paths.milestone_id(ctx.milestone), "milestone", "Comment on milestone")
      assert_created_comment(conn, Paths.task_id(ctx.task), "project_task", "Comment on project task")
    end

    test "creates comments for goal resources" do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_goal(:goal, :space)
        |> Factory.add_goal_discussion(:discussion, :goal)
        |> Factory.add_goal_update(:check_in, :goal, :creator)

      conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator, ["mcp:read", "mcp:write"])

      assert_created_comment(conn, Paths.goal_discussion_id(ctx.discussion), "goal_discussion", "Comment on goal discussion")
      assert_created_comment(conn, Paths.goal_update_id(ctx.check_in), "goal_check_in", "Comment on goal check-in")
    end

    test "creates comments for space resources" do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_messages_board(:board, :space)
        |> Factory.add_message(:discussion, :board)
        |> Factory.create_space_task(:task, :space)

      conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator, ["mcp:read", "mcp:write"])

      assert_created_comment(conn, Paths.message_id(ctx.discussion), "space_discussion", "Comment on space discussion")
      assert_created_comment(conn, Paths.task_id(ctx.task), "space_task", "Comment on space task")
    end

    test "creates comments for resource hub resources" do
      ctx =
        %{}
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.fetch_default_resource_hub(:hub, :space)
        |> Factory.add_document(:document, :hub)
        |> Factory.add_file(:file, :hub)
        |> Factory.add_link(:link, :hub)

      conn = ToolConnHelper.conn_with_assigns(ctx.account, ctx.company, ctx.creator, ["mcp:read", "mcp:write"])

      assert_created_comment(conn, Paths.document_id(ctx.document), "document", "Comment on document")
      assert_created_comment(conn, Paths.file_id(ctx.file), "file", "Comment on file")
      assert_created_comment(conn, Paths.link_id(ctx.link), "link", "Comment on link")
    end

    test "returns invalid_arguments for malformed identifiers and blank content" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = ToolConnHelper.conn_with_assigns(account, company, person, ["mcp:read", "mcp:write"])

      assert {:error, :invalid_arguments} =
               Create.call(conn, %{"resource_id" => "definitely-not-a-valid-operately-id-%%%", "parent_type" => "project_discussion", "content" => "Comment"})

      assert {:error, :invalid_arguments} =
               Create.call(conn, %{"resource_id" => "definitely-not-a-valid-operately-id-%%%", "parent_type" => "project_discussion", "content" => "   "})

      assert {:error, :invalid_arguments} =
               Create.call(conn, %{"resource_id" => "roadmap-discussion--abc123", "parent_type" => "project", "content" => "Comment"})
    end

    test "returns not_found for non-commentable and inaccessible resources" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      space = group_fixture(person, %{company_id: company.id})
      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: space.id})

      other_account = account_fixture()
      other_company = company_fixture(%{company_name: "Other Company"}, other_account)
      other_person = People.get_person(other_account, other_company)
      other_space = group_fixture(other_person, %{company_id: other_company.id})
      other_goal = goal_fixture(other_person, %{company_id: other_company.id, space_id: other_space.id})
      other_update = goal_update_fixture(other_person, other_goal)

      conn = ToolConnHelper.conn_with_assigns(account, company, person, ["mcp:read", "mcp:write"])

      assert {:error, :not_found} = Create.call(conn, %{"resource_id" => Paths.project_id(project), "parent_type" => "project_discussion", "content" => "Comment"})
      assert {:error, :not_found} = Create.call(conn, %{"resource_id" => Paths.goal_update_id(other_update), "parent_type" => "goal_check_in", "content" => "Comment"})
    end
  end

  defp assert_created_comment(conn, resource_id, parent_type, text) do
    assert {:ok, %{comment: comment}} = Create.call(conn, %{"resource_id" => resource_id, "parent_type" => parent_type, "content" => text})

    assert is_binary(comment.id)
    assert comment.content |> Jason.decode!() |> RichContent.rich_content_to_string() |> normalize_text() == text
  end

  defp normalize_text(text) do
    text
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
  end
end
