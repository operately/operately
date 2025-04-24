defmodule OperatelyWeb.Api.Queries.GetWorkMapTest do
  use OperatelyWeb.TurboCase

  alias OperatelyWeb.Paths
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_work_map, %{})
    end
  end

  describe "permissions - query root items" do
    @table [
      %{person: :company_member,  count: 1,   expected_items: [:public_project]},
      %{person: :space_member,    count: 3,   expected_items: [:public_project, :project1, :project2]},
      %{person: :creator,         count: 4,   expected_items: [:public_project, :project1, :project2, :secret_project]},
      %{person: :champion,        count: 4,   expected_items: [:public_project, :project1, :project2, :secret_project]},
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:company_member)
      |> Factory.add_space_member(:space_member, :space)
      |> Factory.add_space_member(:champion, :space)

      # Project hierarchy:
      # ├── public_project  (accessible to everyone)
      # ├── project1        (accessible to space members only)
      # ├── project2        (accessible to space members only)
      # └── secret_project  (accessible to admin and champion only)
      |> Factory.add_project(:public_project, :space)
      |> Factory.add_project(:project1, :space, company_access_level: Binding.no_access())
      |> Factory.add_project(:project2, :space, company_access_level: Binding.no_access())
      |> Factory.add_project(:secret_project, :space, [
        champion: :champion,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      ])
    end

    tabletest @table do
      test "#{@test.person} has access to #{Enum.map_join(@test.expected_items, ", ", &Atom.to_string/1)}", ctx do
        ctx = Factory.log_in_person(ctx, @test.person)
        expected_items = Enum.map(@test.expected_items, &ctx[&1].id)

        assert {200, res} = query(ctx.conn, :get_work_map, %{})

        assert length(res.work_map) == @test.count
        Enum.each(res.work_map, fn item ->
          assert Enum.member?(expected_items, item.id)
        end)
      end
    end
  end

  describe "permissions - query nested items" do
    @table [
      %{person: :company_member,  count: 1,   expected_items: [:public_project]},
      %{person: :space_member,    count: 3,   expected_items: [:public_project, :project1, :project2]},
      %{person: :creator,         count: 4,   expected_items: [:public_project, :project1, :project2, :secret_project]},
      %{person: :champion,        count: 4,   expected_items: [:public_project, :project1, :project2, :secret_project]},
    ]

    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:company_member)
      |> Factory.add_space_member(:space_member, :space)
      |> Factory.add_space_member(:champion, :space)
      |> Factory.add_goal(:parent_goal, :space)
      |> Factory.add_goal(:child_goal, :space, parent_goal: :parent_goal)

      # Project hierarchy:
      # parent_goal
      # └── child_goal
      #     ├── public_project  (accessible to everyone)
      #     ├── project1        (accessible to space members only)
      #     ├── project2        (accessible to space members only)
      #     └── secret_project  (accessible to champion only)
      |> Factory.add_project(:public_project, :space, goal: :child_goal)
      |> Factory.add_project(:project1, :space, goal: :child_goal, company_access_level: Binding.no_access())
      |> Factory.add_project(:project2, :space, goal: :child_goal, company_access_level: Binding.no_access())
      |> Factory.add_project(:secret_project, :space, [
        goal: :child_goal,
        champion: :champion,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      ])
    end

    tabletest @table do
      test "#{@test.person} has access to #{Enum.map_join(@test.expected_items, ", ", &Atom.to_string/1)}", ctx do
        ctx = Factory.log_in_person(ctx, @test.person)
        expected_items = Enum.map(@test.expected_items, &ctx[&1].id)

        assert {200, res} = query(ctx.conn, :get_work_map, %{})

        # Find the parent goal in the result
        parent_item = Enum.find(res.work_map, &(&1.id == ctx.parent_goal.id))

        # Find the child goal in the parent's children
        child_item = Enum.find(parent_item.children, &(&1.id == ctx.child_goal.id))

        # Verify the projects under the child goal
        assert length(child_item.children) == @test.count
        Enum.each(child_item.children, fn item ->
          assert Enum.member?(expected_items, item.id)
        end)
      end
    end
  end

  describe "permissions - query goals" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:company_member)
      |> Factory.add_space_member(:space_member, :space)
      |> Factory.add_space_member(:champion, :space)

      # Goal hierarchy:
      # public1             (accessible to everyone)
      # ├── public2         (accessible to everyone)
      # │   └── internal2   (accessible to space members only)
      # │       └── secret2 (accessible to admin and champion only)
      # └── internal1       (accessible to space members only)
      # secret1             (accessible to admin and champion only)
      |> Factory.add_goal(:public1, :space)
      |> Factory.add_goal(:public2, :space, parent_goal: :public1)
      |> Factory.add_goal(:internal1, :space, parent_goal: :public1, company_access: Binding.no_access())
      |> Factory.add_goal(:internal2, :space, parent_goal: :public2, company_access: Binding.no_access())
      |> Factory.add_goal(:secret1, :space, [
        champion: :champion,
        company_access: Binding.no_access(),
        space_access: Binding.no_access(),
      ])
      |> Factory.add_goal(:secret2, :space, [
        parent_goal: :internal2,
        champion: :champion,
        company_access: Binding.no_access(),
        space_access: Binding.no_access(),
      ])
    end

    test "company member has access to 2 public goals", ctx do
      ctx = Factory.log_in_person(ctx, :company_member)

      assert {200, res} = query(ctx.conn, :get_work_map, %{})

      # Should see only public1 at the root level
      assert length(res.work_map) == 1
      public1 = Enum.find(res.work_map, &(&1.id == ctx.public1.id))

      # Should see only public2 as a child of public1
      assert length(public1.children) == 1
      public2 = Enum.find(public1.children, &(&1.id == ctx.public2.id))

      # public2 should have no visible children
      assert public2.children == []
    end

    test "space member has access to 4 public and internal goals", ctx do
      ctx = Factory.log_in_person(ctx, :space_member)

      assert {200, res} = query(ctx.conn, :get_work_map, %{})

      # Should see only public1 at the root level
      assert length(res.work_map) == 1
      public1 = Enum.find(res.work_map, &(&1.id == ctx.public1.id))

      # Should see both public2 and internal1 as children of public1
      assert length(public1.children) == 2
      public2 = Enum.find(public1.children, &(&1.id == ctx.public2.id))
      internal1 = Enum.find(public1.children, &(&1.id == ctx.internal1.id))

      # internal1 should have no children
      assert internal1.children == []

      # public2 should have internal2 as a child
      assert length(public2.children) == 1
      internal2 = Enum.find(public2.children, &(&1.id == ctx.internal2.id))

      # internal2 should have no visible children
      assert internal2.children == []
    end

    @table [
      %{person: :creator},
      %{person: :champion},
    ]

    tabletest @table do
      test "#{@test.person} has access to all 6 goals including secret ones", ctx do
        ctx = Factory.log_in_person(ctx, @test.person)

        assert {200, res} = query(ctx.conn, :get_work_map, %{})

        # Should see both public1 and secret1 at the root level
        assert length(res.work_map) == 2

        # Verify secret1 is visible and has no children
        secret1 = Enum.find(res.work_map, &(&1.id == ctx.secret1.id))
        assert secret1.children == []

        # Verify public1 is visible with both children
        public1 = Enum.find(res.work_map, &(&1.id == ctx.public1.id))
        assert length(public1.children) == 2

        # Verify both public2 and internal1 are children of public1
        public2 = Enum.find(public1.children, &(&1.id == ctx.public2.id))
        internal1 = Enum.find(public1.children, &(&1.id == ctx.internal1.id))

        # internal1 should have no children
        assert internal1.children == []

        # public2 should have internal2 as a child
        assert length(public2.children) == 1
        internal2 = Enum.find(public2.children, &(&1.id == ctx.internal2.id))

        # internal2 should have secret2 as a child
        assert length(internal2.children) == 1
        secret2 = Enum.find(internal2.children, &(&1.id == ctx.secret2.id))
        assert secret2.children == []
      end
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space1)
      |> Factory.add_space(:space2)
      |> Factory.add_space(:space3)
      |> Factory.add_goal(:goal1, :space1)
      |> Factory.add_goal(:goal2, :space1)
      |> Factory.add_project(:project1, :space1)
      |> Factory.add_project(:project2, :space2)
    end

    test "returns empty list when no matching items exist", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Query with a non-existent space_id
      assert {200, res} = query(ctx.conn, :get_work_map, %{space_id: Paths.space_id(ctx.space3)})
      assert res.work_map == []
    end

    test "filters by space_id", ctx do
      ctx = Factory.log_in_person(ctx, :creator)

      # Query for space1
      assert {200, res} = query(ctx.conn, :get_work_map, %{space_id: Paths.space_id(ctx.space1)})

      # Should return 3 items from space1
      assert length(res.work_map) == 3
      assert Enum.any?(res.work_map, &(&1.id == ctx.goal1.id))
      assert Enum.any?(res.work_map, &(&1.id == ctx.goal2.id))
      assert Enum.any?(res.work_map, &(&1.id == ctx.project1.id))

      # Query for space2
      assert {200, res} = query(ctx.conn, :get_work_map, %{space_id: Paths.space_id(ctx.space2)})

      # Should return 1 item from space2
      assert length(res.work_map) == 1
      assert Enum.any?(res.work_map, &(&1.id == ctx.project2.id))
    end

    test "filters by parent_goal_id", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:child_goal, :space1, parent_goal: :goal1)
        |> Factory.log_in_person(:creator)

      # Query for children of goal1
      assert {200, res} = query(ctx.conn, :get_work_map, %{parent_goal_id: Paths.goal_id(ctx.goal1)})

      # Should return only the child goal
      assert length(res.work_map) == 1
      assert Enum.any?(res.work_map, &(&1.id == ctx.child_goal.id))
    end

    test "filters by owner_id", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:other_member)
        |> Factory.add_goal(:owned_goal, :space1, champion: :other_member)
        |> Factory.log_in_person(:creator)

      # Query for items owned by other_member
      assert {200, res} = query(ctx.conn, :get_work_map, %{owner_id: Paths.person_id(ctx.other_member)})

      # Should return only the owned goal
      assert length(res.work_map) == 1
      assert Enum.any?(res.work_map, &(&1.id == ctx.owned_goal.id))
    end

    test "returns hierarchical structure", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:parent_goal, :space1)
        |> Factory.add_goal(:child_goal, :space1, parent_goal: :parent_goal)
        |> Factory.add_project(:child_project, :space1, goal: :child_goal)
        |> Factory.log_in_person(:creator)

      assert {200, res} = query(ctx.conn, :get_work_map, %{})

      # Find the parent goal in the result
      parent_item = Enum.find(res.work_map, &(&1.id == ctx.parent_goal.id))

      # Verify that the parent goal has the child goal as a child
      child_item = Enum.find(parent_item.children, &(&1.id == ctx.child_goal.id))

      # Verify that the child goal has the project as a child
      assert Enum.find(child_item.children, &(&1.id == ctx.child_project.id))
    end
  end
end
