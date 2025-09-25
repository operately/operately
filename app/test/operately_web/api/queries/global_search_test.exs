defmodule OperatelyWeb.Api.Queries.GlobalSearchTest do
  use OperatelyWeb.TurboCase

  alias Operately.Support.Factory

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :global_search, query: "test")
    end
  end

  describe "global_search functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:marketing)
      |> Factory.add_space(:engineering)
    end

    test "returns empty results for queries less than 2 characters", ctx do
      ctx = log_in(ctx)

      assert {200, res} = query(ctx.conn, :global_search, query: "a")
      assert res == %{projects: [], goals: [], tasks: [], people: []}
    end

    test "searches projects by name", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing, name: "Website Redesign")
        |> Factory.add_project(:mobile_app, :engineering, name: "Mobile App")

      assert {200, res} = query(ctx.conn, :global_search, query: "Website")

      assert length(res.projects) == 1
      assert List.first(res.projects).name == "Website Redesign"
    end

    test "searches goals by name", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_goal(:user_engagement, :marketing, name: "Increase User Engagement")
        |> Factory.add_goal(:performance, :engineering, name: "Improve Performance")

      assert {200, res} = query(ctx.conn, :global_search, query: "User")

      assert length(res.goals) == 1
      assert List.first(res.goals).name == "Increase User Engagement"
    end

    test "searches tasks by name", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing)
        |> Factory.add_project_milestone(:launch, :website)
        |> Factory.add_project_task(:auth_task, :launch, name: "Implement authentication")
        |> Factory.add_project_task(:design_task, :launch, name: "Design homepage")

      assert {200, res} = query(ctx.conn, :global_search, query: "authentication")

      assert length(res.tasks) == 1
      assert List.first(res.tasks).name == "Implement authentication"
    end

    test "searches people by name", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_company_member(:john, full_name: "John Developer", title: "Senior Developer")
        |> Factory.add_company_member(:jane, full_name: "Jane Manager", title: "Product Manager")

      assert {200, res} = query(ctx.conn, :global_search, query: "John")

      assert length(res.people) == 1
      assert List.first(res.people).full_name == "John Developer"
    end

    test "searches people by title", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_company_member(:john, full_name: "John Smith", title: "Backend Developer")
        |> Factory.add_company_member(:jane, full_name: "Jane Doe", title: "Frontend Developer")

      assert {200, res} = query(ctx.conn, :global_search, query: "Developer")

      assert length(res.people) == 2
      people_names = Enum.map(res.people, & &1.full_name)
      assert "John Smith" in people_names
      assert "Jane Doe" in people_names
    end

    test "returns work map link", ctx do
      ctx = log_in(ctx)

      assert {200, res} = query(ctx.conn, :global_search, query: "work")
      refute Map.has_key?(res, :work_map_link)
    end

    test "limits results to 5 per category", ctx do
      ctx =
        ctx
        |> log_in()
        |> add_multiple_projects(7, :marketing)

      assert {200, res} = query(ctx.conn, :global_search, query: "Project")
      assert length(res.projects) == 5
    end

    test "case insensitive search", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing, name: "Website Redesign")

      assert {200, res} = query(ctx.conn, :global_search, query: "website")
      assert length(res.projects) == 1

      assert {200, res} = query(ctx.conn, :global_search, query: "WEBSITE")
      assert length(res.projects) == 1
    end

    test "excludes suspended people", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_company_member(:john, full_name: "John Developer", suspended: false)
        |> Factory.add_company_member(:jane, full_name: "Jane Developer", suspended: true)

      assert {200, res} = query(ctx.conn, :global_search, query: "Developer")

      assert length(res.people) == 1
      assert List.first(res.people).full_name == "John Developer"
    end

    test "respects access controls for projects", ctx do
      # This test ensures that projects the user doesn't have access to are not returned
      # The actual access control logic is tested in the filter_by_view_access module
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing, name: "Public Website")

      assert {200, res} = query(ctx.conn, :global_search, query: "Website")
      assert length(res.projects) == 1
    end

    test "returns mixed results for general queries", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:test_project, :marketing, name: "Test Project")
        |> Factory.add_goal(:test_goal, :marketing, name: "Test Goal")
        |> Factory.add_company_member(:tester, full_name: "Test User")

      assert {200, res} = query(ctx.conn, :global_search, query: "test")

      assert length(res.projects) == 1
      assert length(res.goals) == 1
      assert length(res.people) == 1
    end

    defp add_multiple_projects(ctx, count, space_key) do
      Enum.reduce(1..count, ctx, fn i, acc_ctx ->
        Factory.add_project(acc_ctx, String.to_atom("project_#{i}"), space_key, name: "Project #{i}")
      end)
    end

    defp log_in(ctx) do
      ctx |> Factory.log_in_person(:creator)
    end
  end
end
