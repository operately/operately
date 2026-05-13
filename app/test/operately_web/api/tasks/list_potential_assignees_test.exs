defmodule OperatelyWeb.Api.Tasks.ListPotentialAssigneesTest do
  use OperatelyWeb.TurboCase

  alias Operately.Support.Factory

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:tasks, :list_potential_assignees], %{id: "123", type: "project"})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
    end

    test "returns people with access to the project", ctx do
      ctx =
        ctx
        |> Factory.add_space(:marketing)
        |> Factory.add_project(:website, :marketing)
        |> Factory.add_space_member(:alice, :marketing, name: "Alice Johnson")
        |> Factory.add_space_member(:bob, :marketing, name: "Bob Smith")

      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{id: Paths.project_id(ctx.website), type: "project"})

      # Should include the creator and the two space members
      assert length(res.people) == 3
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.creator)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.alice)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.bob)))
    end

    test "returns not found for non-existent project", ctx do
      fake_id = Ecto.UUID.generate()
      assert {404, %{message: "The requested resource was not found"}} =
        query(ctx.conn, [:tasks, :list_potential_assignees], %{id: fake_id, type: "project"})
    end

    test "returns not found if user doesn't have access to project", ctx do
      # Create a completely separate company/account to ensure no access
      other_ctx = Factory.setup(%{})
      other_ctx =
        other_ctx
        |> Factory.add_space(:other_space)
        |> Factory.add_project(:private_project, :other_space)

      # Current user (creator) should not have access to other company's project
      assert {404, %{message: "The requested resource was not found"}} =
        query(ctx.conn, [:tasks, :list_potential_assignees], %{
          id: Paths.project_id(other_ctx.private_project),
          type: "project"
        })
    end

    test "suspended people are not included in results", ctx do
      ctx =
        ctx
        |> Factory.add_space(:marketing)
        |> Factory.add_project(:website, :marketing)
        |> Factory.add_space_member(:active_person, :marketing, name: "Active Person")
        |> Factory.add_space_member(:suspended_person, :marketing, name: "Suspended Person")
        |> Factory.suspend_company_member(:suspended_person)

      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{id: Paths.project_id(ctx.website), type: "project"})

      # Should only include creator and active_person, not suspended_person
      assert length(res.people) == 2
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.creator)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.active_person)))
      refute Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.suspended_person)))
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:engineering)
      |> Factory.add_project(:website, :engineering)
      |> Factory.add_project_contributor(:project_contributor, :website, :as_person)
      |> Factory.add_space_member(:john, :engineering, name: "AssignmentTarget One")
      |> Factory.add_space_member(:mike, :engineering, name: "Needle Beta")
      |> Factory.add_space_member(:sarah, :engineering, name: "AssignmentTarget Two")
    end

    test "returns current user, project contributors, and space members by default", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{id: Paths.project_id(ctx.website), type: "project"})

      assert length(res.people) == 5
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.creator)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.project_contributor)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.john)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.mike)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.sarah)))
    end

    test "filters people by name", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{
        id: Paths.project_id(ctx.website),
        type: "project",
        query: "Needle"
      })

      assert length(res.people) == 1
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.mike)))
    end

    test "filters people by partial name match", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{
        id: Paths.project_id(ctx.website),
        type: "project",
        query: "Beta"
      })

      assert length(res.people) == 1
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.mike)))
    end

    test "query is case insensitive", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{
        id: Paths.project_id(ctx.website),
        type: "project",
        query: "needle"
      })

      assert length(res.people) == 1
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.mike)))
    end

    test "query matches partial names", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{
        id: Paths.project_id(ctx.website),
        type: "project",
        query: "AssignmentTarget"
      })

      assert length(res.people) == 2
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.john)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.sarah)))
    end

    test "ignored_ids excludes people from results", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{
        id: Paths.project_id(ctx.website),
        type: "project",
        ignored_ids: [Paths.person_id(ctx.john), Paths.person_id(ctx.mike)]
      })

      assert length(res.people) == 3
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.creator)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.project_contributor)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.sarah)))
      refute Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.john)))
      refute Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.mike)))
    end

    test "combines query and ignored_ids filters", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{
        id: Paths.project_id(ctx.website),
        type: "project",
        query: "AssignmentTarget",
        ignored_ids: [Paths.person_id(ctx.john)]
      })

      assert length(res.people) == 1
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.sarah)))
    end

    test "returns current user first, then project contributors, then space members by full name", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{id: Paths.project_id(ctx.website), type: "project"})

      [first | rest] = res.people
      assert first.id == Paths.person_id(ctx.creator)

      assert Enum.find_index(rest, &(&1.id == Paths.person_id(ctx.project_contributor))) <
               Enum.find_index(rest, &(&1.id == Paths.person_id(ctx.john)))

      space_member_names =
        rest
        |> Enum.filter(&(&1.id in [Paths.person_id(ctx.john), Paths.person_id(ctx.mike), Paths.person_id(ctx.sarah)]))
        |> Enum.map(& &1.full_name)

      assert space_member_names == Enum.sort(space_member_names)
    end

    test "does not show company-only members by default, but finds them by search when they have access", ctx do
      ctx = Factory.add_company_member(ctx, :company_only, name: "Company Only")

      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{id: Paths.project_id(ctx.website), type: "project"})
      refute Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.company_only)))

      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{
        id: Paths.project_id(ctx.website),
        type: "project",
        query: "Company"
      })

      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.company_only)))
    end

    test "returns empty list when query matches no one", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{
        id: Paths.project_id(ctx.website),
        type: "project",
        query: "NonExistentName"
      })

      assert length(res.people) == 0
    end
  end

  describe "space tasks" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:john, :space, name: "SpaceAssignee One")
      |> Factory.add_space_member(:sarah, :space, name: "SpaceAssignee Two")
    end

    test "returns people with access to the space", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{id: Paths.space_id(ctx.space), type: "space"})

      # Should include creator + 2 space members
      assert length(res.people) == 3
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.creator)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.john)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.sarah)))
    end

    test "filters people by name in space", ctx do
      assert {200, res} = query(ctx.conn, [:tasks, :list_potential_assignees], %{
        id: Paths.space_id(ctx.space),
        type: "space",
        query: "SpaceAssignee"
      })

      assert length(res.people) == 2
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.john)))
      assert Enum.any?(res.people, &(&1.id == Paths.person_id(ctx.sarah)))
    end
  end
end
