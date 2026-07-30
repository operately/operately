defmodule OperatelyWeb.Api.Companies.GlobalSearchTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Search
  alias Operately.Search.SourceIndexer
  alias Operately.Support.{Factory, RichText}

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:companies, :global_search], query: "test")
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

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "a")

      assert res == %{
               spaces: [],
               projects: [],
               goals: [],
               milestones: [],
               tasks: [],
               people: [],
               full_text_results: []
             }
    end

    test "returns indexed body matches with full result metadata", ctx do
      ctx =
        ctx
        |> Factory.add_project(:project, :marketing, name: "Website redesign")
        |> log_in()

      project =
        ctx.project
        |> Operately.Projects.Project.changeset(%{
          description: RichText.rich_text("Customer interviews revealed a navigation bottleneck")
        })
        |> Repo.update!()

      assert {:ok, _summary} = SourceIndexer.sync("project", project.id)
      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "navigation bottleneck")

      assert res.projects == []

      assert [
               %{
                 id: id,
                 type: "project",
                 title: "Website redesign",
                 context: "Product Space",
                 matched_field: "description",
                 snippet: snippet,
                 state: nil,
                 navigation_target: %{project_id: project_id}
               }
             ] = res.full_text_results

      assert id == Operately.ShortUuid.encode!(project.id)
      assert project_id == Operately.ShortUuid.encode!(project.id)
      assert snippet =~ "navigation bottleneck"
      refute snippet =~ "__OPERATELY_SEARCH"
    end

    test "deduplicates grouped matches without changing the remaining full-text order", ctx do
      ctx =
        ctx
        |> Factory.add_project(:grouped_project, :marketing, name: "Signal roadmap")
        |> Factory.add_project(:body_project, :marketing, name: "Website redesign")
        |> Factory.add_project(:closed_project, :marketing, name: "Signal archive")
        |> Factory.close_project(:closed_project)
        |> log_in()

      body_project =
        ctx.body_project
        |> Operately.Projects.Project.changeset(%{description: RichText.rich_text("Signal research")})
        |> Repo.update!()

      Enum.each([ctx.grouped_project, body_project, ctx.closed_project], fn project ->
        assert {:ok, _summary} = SourceIndexer.sync("project", project.id)
      end)

      expected_ids =
        ctx.creator
        |> Search.search_company("Signal")
        |> Enum.reject(&(&1.id == ctx.grouped_project.id))
        |> Enum.map(&Operately.ShortUuid.encode!(&1.id))

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Signal")
      assert Enum.map(res.projects, & &1.id) == [OperatelyWeb.Paths.project_id(ctx.grouped_project)]
      assert Enum.map(res.full_text_results, & &1.id) == expected_ids
      refute Enum.any?(res.full_text_results, &(&1.id == Operately.ShortUuid.encode!(ctx.grouped_project.id)))
      assert Enum.any?(res.full_text_results, &(&1.state == "closed"))
    end

    test "applies live permissions to full-text results", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:viewer)
        |> Factory.add_project(:private_project, :marketing,
          name: "Private project",
          company_access_level: Binding.no_access(),
          space_access_level: Binding.no_access()
        )
        |> Factory.log_in_person(:viewer)

      private_project =
        ctx.private_project
        |> Operately.Projects.Project.changeset(%{
          description: RichText.rich_text("Confidential acquisition marker")
        })
        |> Repo.update!()

      assert {:ok, _summary} = SourceIndexer.sync("project", private_project.id)
      assert {200, %{full_text_results: []}} = query(ctx.conn, [:companies, :global_search], query: "Confidential acquisition marker")

      context = Access.get_context!(project_id: private_project.id)
      assert {:ok, _binding} = Access.bind(context, person_id: ctx.viewer.id, level: Binding.view_access())

      assert {200, %{full_text_results: [%{id: result_id}]}} =
               query(ctx.conn, [:companies, :global_search], query: "Confidential acquisition marker")

      assert result_id == Operately.ShortUuid.encode!(private_project.id)
      assert {:ok, _binding} = Access.unbind(context, person_id: ctx.viewer.id)
      assert {200, %{full_text_results: []}} = query(ctx.conn, [:companies, :global_search], query: "Confidential acquisition marker")
    end

    test "searches spaces by name", ctx do
      ctx =
        ctx
        |> Factory.add_space(:support, name: "Support Space", company_permissions: Binding.view_access())
        |> log_in()

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Support")

      assert length(res.spaces) == 1
      assert List.first(res.spaces).name == "Support Space"
    end

    test "returns only spaces that the user can see", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:member)
        |> Factory.add_space(:product, name: "Product Space", company_permissions: Binding.view_access())
        |> Factory.add_space(:secret, name: "Secret Product Space", company_permissions: Binding.no_access())
        |> Factory.log_in_person(:member)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Product")

      assert length(res.spaces) == 1
      assert List.first(res.spaces).name == "Product Space"
    end

    test "searches projects by name", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing, name: "Website Redesign")
        |> Factory.add_project(:mobile_app, :engineering, name: "Mobile App")

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Website")

      assert length(res.projects) == 1
      assert List.first(res.projects).name == "Website Redesign"
    end

    test "does not return closed projects", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing, name: "Website Redesign")
        |> Factory.close_project(:website)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Website")
      assert res.projects == []
    end

    test "searches goals by name", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_goal(:user_engagement, :marketing, name: "Increase User Engagement")
        |> Factory.add_goal(:performance, :engineering, name: "Improve Performance")

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "User")

      assert length(res.goals) == 1
      assert List.first(res.goals).name == "Increase User Engagement"
    end

    test "does not return closed goals", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_goal(:user_engagement, :marketing, name: "Increase User Engagement")
        |> Factory.close_goal(:user_engagement)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "User")
      assert res.goals == []
    end

    test "searches tasks by name", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing)
        |> Factory.add_project_milestone(:launch, :website)
        |> Factory.add_project_task(:auth_task, :launch, name: "Implement authentication")
        |> Factory.add_project_task(:design_task, :launch, name: "Design homepage")

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "authentication")

      assert length(res.tasks) == 1
      assert List.first(res.tasks).name == "Implement authentication"
    end

    test "does not return tasks that belong to closed projects", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing, name: "Website Redesign")
        |> Factory.add_project_milestone(:launch, :website)
        |> Factory.add_project_task(:auth_task, :launch, name: "Implement authentication")
        |> Factory.close_project(:website)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "authentication")
      assert res.tasks == []
    end

    test "searches people by name", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_company_member(:john, full_name: "John Developer", title: "Senior Developer")
        |> Factory.add_company_member(:jane, full_name: "Jane Manager", title: "Product Manager")

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "John")

      assert Enum.any?(res.people, &(&1.full_name == "John Developer"))
      refute Enum.any?(res.people, &(&1.full_name == "Jane Manager"))
    end

    test "searches people by title", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_company_member(:john, full_name: "John Smith", title: "Backend Developer")
        |> Factory.add_company_member(:jane, full_name: "Jane Doe", title: "Frontend Developer")

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Developer")

      assert length(res.people) == 2
      people_names = Enum.map(res.people, & &1.full_name)
      assert "John Smith" in people_names
      assert "Jane Doe" in people_names
    end

    test "returns work map link", ctx do
      ctx = log_in(ctx)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "work")
      refute Map.has_key?(res, :work_map_link)
    end

    test "limits results to 5 per category", ctx do
      ctx =
        ctx
        |> log_in()
        |> add_multiple_projects(7, :marketing)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Project")
      assert length(res.projects) == 5
    end

    test "case insensitive search", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing, name: "Website Redesign")

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "website")
      assert length(res.projects) == 1

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "WEBSITE")
      assert length(res.projects) == 1
    end

    test "excludes suspended people", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_company_member(:john, full_name: "John Developer", suspended: false)
        |> Factory.add_company_member(:jane, full_name: "Jane Developer", suspended: true)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Developer")

      assert length(res.people) == 1
      assert List.first(res.people).full_name == "John Developer"
    end

    test "returns only projects that the user can see", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:viewer)
        |> Factory.add_project(:visible_project, :marketing,
          name: "Visible Website",
          company_access_level: Binding.view_access(),
          space_access_level: Binding.view_access()
        )
        |> Factory.add_project(:private_project, :marketing,
          name: "Private Website",
          company_access_level: Binding.no_access(),
          space_access_level: Binding.no_access()
        )
        |> Factory.log_in_person(:viewer)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Website")
      assert Enum.map(res.projects, & &1.name) == ["Visible Website"]
    end

    test "returns mixed results for general queries", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:test_project, :marketing, name: "Test Project")
        |> Factory.add_goal(:test_goal, :marketing, name: "Test Goal")
        |> Factory.add_company_member(:tester, full_name: "Test User")

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "test")

      assert length(res.projects) == 1
      assert length(res.goals) == 1
      assert length(res.people) == 1
    end

    test "searches milestones by title", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing)
        |> Factory.add_project_milestone(:launch, :website, title: "Launch Milestone")
        |> Factory.add_project_milestone(:beta, :website, title: "Beta Release")

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Launch")

      assert length(res.milestones) == 1
      assert List.first(res.milestones).title == "Launch Milestone"
    end

    test "does not return done milestones", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing)
        |> Factory.add_project_milestone(:launch, :website, title: "Launch Milestone", status: :done)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Launch")
      assert res.milestones == []
    end

    test "does not return milestones that belong to closed projects", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing, name: "Website Redesign")
        |> Factory.add_project_milestone(:launch, :website, title: "Launch Milestone")
        |> Factory.close_project(:website)

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Launch")
      assert res.milestones == []
    end

    test "searches space tasks by name", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.create_space_task(:space_task, :marketing, name: "Marketing Strategy Task")

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Strategy")

      assert length(res.tasks) == 1
      assert List.first(res.tasks).name == "Marketing Strategy Task"
    end

    test "does not return closed tasks", ctx do
      ctx =
        ctx
        |> log_in()
        |> Factory.add_project(:website, :marketing)
        |> Factory.add_project_milestone(:launch, :website)
        |> Factory.add_project_task(:open_task, :launch, name: "Open Task")
        |> Factory.add_project_task(:closed_task, :launch, name: "Closed Task")

      # Close the task
      closed_status = Operately.Tasks.Status.default_task_statuses() |> Enum.find(& &1.closed)
      {:ok, _} = Operately.Tasks.update_task(ctx.closed_task, %{task_status: Map.from_struct(closed_status)})

      assert {200, res} = query(ctx.conn, [:companies, :global_search], query: "Task")

      assert length(res.tasks) == 1
      assert List.first(res.tasks).name == "Open Task"
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
