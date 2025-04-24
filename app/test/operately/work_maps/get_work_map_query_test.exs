defmodule Operately.WorkMaps.GetWorkMapQueryTest do
  use Operately.DataCase

  alias Operately.Access.Binding
  alias Operately.WorkMaps.GetWorkMapQuery

  describe "functionality - execute/1 with only company_id parameter" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space1)
        |> Factory.add_space(:space2)
        |> Factory.add_goal(:root_goal1, :space1)
        |> Factory.add_goal(:root_goal2, :space1)
        |> Factory.add_project(:root_project1, :space1)
        |> Factory.add_project(:root_project2, :space2)
        |> Factory.add_project(:project_with_goal1, :space1, goal: :root_goal1)
        |> Factory.add_project(:project_with_goal2, :space1, goal: :root_goal2)

      # Create a different company to test filtering
      ctx
      |> Factory.setup()
      |> Factory.add_space(:other_space)
      |> Factory.add_goal(:other_goal, :other_space)
      |> Factory.add_project(:other_project, :other_space)

      ctx
    end

    test "returns only root goals and projects for the specified company", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id})

      # Should return 4 items: 2 root goals and 2 root projects
      assert length(work_map) == 4

      # Count goals and projects
      goal_count = Enum.count(work_map, fn item -> item.type == :goal end)
      project_count = Enum.count(work_map, fn item -> item.type == :project end)

      assert goal_count == 2
      assert project_count == 2

      # Verify each each project has empty children array and goal doesn't
      Enum.each(work_map, fn item ->
        if item.type == :goal do
          assert length(item.children) == 1
        else
          assert item.children == []
        end
      end)
    end
  end

  describe "functionality - execute/1 with company_id and space_id parameters" do
    setup ctx do
      ctx
      |> Factory.setup()

      # space 1
      |> Factory.add_space(:space1)
      |> Factory.add_goal(:goal1, :space1)
      |> Factory.add_project(:project1, :space1)

      # space 2
      |> Factory.add_space(:space2)
      |> Factory.add_project(:root_project, :space2)
      |> Factory.add_goal(:root_goal, :space2)
      |> Factory.add_goal(:child_goal1, :space2, parent_goal: :root_goal)
      |> Factory.add_goal(:child_goal2, :space2, parent_goal: :root_goal)
      |> Factory.add_goal(:grandchild_goal, :space2, parent_goal: :child_goal1)
      |> Factory.add_project(:grandchild_project1, :space2, goal: :grandchild_goal)
      |> Factory.add_project(:grandchild_project2, :space2, goal: :grandchild_goal)

      # space 3
      |> Factory.add_space(:space3)
      |> Factory.add_project(:project_s3_1, :space3)
      |> Factory.add_project(:project_s3_2, :space3)
      |> Factory.add_project(:project_s3_3, :space3)
    end

    test "returns only goals and projects for the specified space", %{company: company, space1: space1} do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: company.id, space_id: space1.id})

      # Should return 2 items: 1 goal and 1 project from space1
      assert length(work_map) == 2

      # Verify all items belong to space1
      Enum.each(work_map, fn item ->
        assert item.space.id == space1.id
      end)
    end

    test "returns only goals and projects for space2 with correct hierarchy", %{company: company, space2: space2} = ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: company.id, space_id: space2.id})

      # Should return 2 items: 1 root goal and 1 root project from space2
      assert length(work_map) == 2

      # Find the root goal
      root_goal_item = Enum.find(work_map, fn item ->
        item.type == :goal && item.parent_id == nil
      end)
      assert root_goal_item

      # Find the root project
      assert Enum.find(work_map, fn item ->
        item.type == :project && item.parent_id == nil
      end)

      # Verify all items belong to space2
      Enum.each(work_map, fn item ->
        assert item.space.id == space2.id
      end)

      # Verify the hierarchy
      assert length(root_goal_item.children) == 2

      # Find child_goal1 in children
      child_goal1_item = Enum.find(root_goal_item.children, fn item ->
        item.type == :goal && item.id == ctx.child_goal1.id
      end)
      assert child_goal1_item

      # Verify child_goal1 has grandchild_goal
      assert length(child_goal1_item.children) == 1
      grandchild_goal_item = Enum.at(child_goal1_item.children, 0)
      assert grandchild_goal_item.id == ctx.grandchild_goal.id

      # Verify grandchild_goal has 2 projects
      assert length(grandchild_goal_item.children) == 2

      Enum.each(grandchild_goal_item.children, fn item ->
        assert item.type == :project
        assert Enum.member?([ctx.grandchild_project1.id, ctx.grandchild_project2.id], item.id)
      end)
    end

    test "returns only projects for space3", %{company: company, space3: space3} = ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: company.id, space_id: space3.id})

      # Should return 3 projects from space3
      assert length(work_map) == 3

      # Verify all items are projects and belong to space3
      Enum.each(work_map, fn item ->
        assert item.type == :project
        assert item.space.id == space3.id
        assert Enum.member?([ctx.project_s3_1.id, ctx.project_s3_2.id, ctx.project_s3_3.id], item.id)
      end)
    end
  end

  describe "functionality - execute/1 with company_id and parent_goal_id parameters" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

      # parent goal
      |> Factory.add_goal(:parent_goal, :space)
      |> Factory.add_goal(:child_goal1, :space, parent_goal: :parent_goal)
      |> Factory.add_goal(:child_goal2, :space, parent_goal: :parent_goal)
      |> Factory.add_project(:child_project, :space, goal: :parent_goal)
      |> Factory.add_goal(:grandchild_goal, :space, parent_goal: :child_goal1)
      |> Factory.add_project(:grandchild_project1, :space, goal: :grandchild_goal)
      |> Factory.add_project(:grandchild_project2, :space, goal: :grandchild_goal)

      # other root resources
      |> Factory.add_project(:root_project, :space)
      |> Factory.add_goal(:root_goal, :space)
    end

    test "returns only child goals and projects for the specified parent goal", %{company: company, parent_goal: parent_goal} = ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: company.id, parent_goal_id: parent_goal.id})

      # Should return 3 items: 2 child goals and 1 child project
      assert length(work_map) == 3

      # Count goals and projects
      goal_count = Enum.count(work_map, fn item -> item.type == :goal end)
      project_count = Enum.count(work_map, fn item -> item.type == :project end)

      assert goal_count == 2
      assert project_count == 1

      # Verify parent relationships
      Enum.each(work_map, fn item ->
        assert item.parent_id == parent_goal.id
      end)

      # Find child_goal1 in the results
      child_goal1_item = Enum.find(work_map, fn item ->
        item.type == :goal && item.id == ctx.child_goal1.id
      end)

      # Verify child_goal1 has grandchild_goal
      assert length(child_goal1_item.children) == 1
      grandchild_goal_item = Enum.at(child_goal1_item.children, 0)
      assert grandchild_goal_item.id == ctx.grandchild_goal.id

      # Verify grandchild_goal has 2 projects
      assert length(grandchild_goal_item.children) == 2

      # Verify the projects under grandchild_goal
      project_ids = Enum.map(grandchild_goal_item.children, fn item ->
        assert item.type == :project
        item.id
      end)
      assert Enum.sort(project_ids) == Enum.sort([ctx.grandchild_project1.id, ctx.grandchild_project2.id])

      # Verify child_goal2 has no children
      child_goal2_item = Enum.find(work_map, fn item ->
        item.type == :goal && item.id == ctx.child_goal2.id
      end)
      assert child_goal2_item.children == []

      # Verify child_project is in the results
      assert Enum.find(work_map, fn item ->
        item.type == :project && item.id == ctx.child_project.id
      end)
    end
  end

  describe "functionality - execute/1 with company_id and owner_id parameters" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:member)

      # Create goals with different champions
      |> Factory.add_goal(:goal1, :space, champion: :creator)
      |> Factory.add_goal(:goal2, :space, champion: :member)

      # Create projects with different champions
      |> Factory.add_project(:project1, :space, champion: :creator)
      |> Factory.add_project(:project2, :space, champion: :member)
    end

    test "returns only goals and projects owned by the specified person", %{company: company, creator: creator} do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: company.id, owner_id: creator.id})

      # Should return 2 items: 1 goal and 1 project owned by creator
      assert length(work_map) == 2

      # Verify ownership
      Enum.each(work_map, fn item ->
        assert item.owner.id == creator.id
      end)
    end
  end

  describe "functionality - execute/1 with deeply nested structure" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

      # Create a 3-level deep goal hierarchy
      |> Factory.add_goal(:root_goal, :space)
      |> Factory.add_goal(:level1_goal, :space, parent_goal: :root_goal)
      |> Factory.add_goal(:level2_goal, :space, parent_goal: :level1_goal)

      # Add projects at each level
      |> Factory.add_project(:root_project, :space, goal: :root_goal)
      |> Factory.add_project(:level1_project, :space, goal: :level1_goal)
      |> Factory.add_project(:level2_project, :space, goal: :level2_goal)

      # Add a sibling goal at level 1
      |> Factory.add_goal(:level1_goal2, :space, parent_goal: :root_goal)
      |> Factory.add_project(:level1_project2, :space, goal: :level1_goal2)
    end

    test "returns complete hierarchy with all nested children", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id})

      # Should return only the root goal (other goals are nested as children)
      assert length(work_map) == 1

      # Get the root goal
      root_item = Enum.find(work_map, fn item -> item.type == :goal end)
      assert root_item

      # Root goal should have 3 children: 2 level1 goals and 1 project
      assert length(root_item.children) == 3

      # Find level1_goal in children
      level1_item = Enum.find(root_item.children, fn item ->
        item.type == :goal && item.id == ctx.level1_goal.id
      end)
      assert level1_item

      # level1_goal should have 2 children: 1 level2 goal and 1 project
      assert length(level1_item.children) == 2

      # Find level2_goal in children
      level2_item = Enum.find(level1_item.children, fn item ->
        item.type == :goal && item.id == ctx.level2_goal.id
      end)
      assert level2_item

      # level2_goal should have 1 child: 1 project
      assert length(level2_item.children) == 1
    end
  end

  describe "functionality - execute/1 with all parameters combined" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space1)
      |> Factory.add_space(:space2)
      |> Factory.add_company_member(:member)

      # Create goals in space1 with different champions
      |> Factory.add_goal(:parent_goal1, :space1, champion: :creator)
      |> Factory.add_goal(:child_goal1, :space1, parent_goal: :parent_goal1, champion: :creator)
      |> Factory.add_goal(:child_goal2, :space1, parent_goal: :parent_goal1, champion: :member)

      # Create goals in space2
      |> Factory.add_goal(:parent_goal2, :space2, champion: :creator)
      |> Factory.add_goal(:child_goal3, :space2, parent_goal: :parent_goal2, champion: :creator)

      # Create projects
      |> Factory.add_project(:project1, :space1, goal: :parent_goal1, champion: :creator)
      |> Factory.add_project(:project2, :space1, goal: :parent_goal1, champion: :member)
    end

    test "filters correctly with all parameters", %{company: company, space1: space1, parent_goal1: parent_goal1, creator: creator} do
      # Test with all parameters
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{
        company_id: company.id,
        space_id: space1.id,
        parent_goal_id: parent_goal1.id,
        owner_id: creator.id
      })

      # Should return 2 items: 1 child goal and 1 project owned by creator in space1 under parent_goal1
      assert length(work_map) == 2

      # Verify correct filtering
      Enum.each(work_map, fn item ->
        # Check space
        assert item.space.id == space1.id

        # Check parent relationship
        assert Enum.member?([:goal, :project], item.type)
        assert item.parent_id == parent_goal1.id
        assert item.owner.id == creator.id
      end)
    end
  end

  describe "permissions - query root projects" do
    @table [
      %{person: :company_member,  count: 1,   expected_projects: [:public_project]},
      %{person: :space_member,    count: 3,   expected_projects: [:public_project, :project1, :project2]},
      %{person: :creator,         count: 4,   expected_projects: [:public_project, :project1, :project2, :secret_project]},
      %{person: :champion,        count: 4,   expected_projects: [:public_project, :project1, :project2, :secret_project]},
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
      test "#{@test.person} has access to #{Enum.map_join(@test.expected_projects, ", ", &Atom.to_string/1)}", ctx do
        expected_projects = Enum.map(@test.expected_projects, &ctx[&1].id)
        {:ok, work_map} = GetWorkMapQuery.execute(ctx[@test.person], %{ company_id: ctx.company.id })

        assert length(work_map) == @test.count
        Enum.each(work_map, fn item ->
          assert Enum.member?(expected_projects, item.id)
        end)
      end
    end
  end

  describe "permissions - query nested projects" do
    @table [
      %{person: :company_member,  count: 1,   expected_projects: [:public_project]},
      %{person: :space_member,    count: 3,   expected_projects: [:public_project, :project1, :project2]},
      %{person: :creator,         count: 4,   expected_projects: [:public_project, :project1, :project2, :secret_project]},
      %{person: :champion,        count: 4,   expected_projects: [:public_project, :project1, :project2, :secret_project]},
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
      test "#{@test.person} has access to #{Enum.map_join(@test.expected_projects, ", ", &Atom.to_string/1)}", ctx do
        {:ok, [parent_goal]} = GetWorkMapQuery.execute(ctx[@test.person], %{ company_id: ctx.company.id })
        assert parent_goal.id == ctx.parent_goal.id

        [child_goal] = parent_goal.children
        assert child_goal.id == ctx.child_goal.id

        expected_projects = Enum.map(@test.expected_projects, &ctx[&1].id)

        Enum.each(child_goal.children, fn item ->
          assert Enum.member?(expected_projects, item.id)
        end)
        assert length(child_goal.children) == @test.count
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
      {:ok, [public1]} = GetWorkMapQuery.execute(ctx.company_member, %{ company_id: ctx.company.id })
      assert public1.id == ctx.public1.id

      [public2] = public1.children
      assert public2.id == ctx.public2.id

      assert public2.children == []
    end

    test "space member has access to 4 public and internal goals", ctx do
      {:ok, [public1]} = GetWorkMapQuery.execute(ctx.space_member, %{ company_id: ctx.company.id })

      assert public1.id == ctx.public1.id
      assert length(public1.children) == 2

      internal1 = Enum.find(public1.children, fn item -> item.id == ctx.internal1.id end)
      assert internal1.children == []

      public2 = Enum.find(public1.children, fn item -> item.id == ctx.public2.id end)
      [internal2] = public2.children

      assert internal2.id == ctx.internal2.id
      assert internal2.children == []
    end

    @table [
      %{person: :creator},
      %{person: :champion},
    ]

    tabletest @table do
      test "#{@test.person} has access to 6 public, internal and secret goals", ctx do
        {:ok, work_map} = GetWorkMapQuery.execute(ctx[@test.person], %{ company_id: ctx.company.id })

        # Should see both root goals (public1 and secret1)
        assert length(work_map) == 2

        # Verify secret1 root goal has no children
        secret1 = Enum.find(work_map, fn item -> item.id == ctx.secret1.id end)
        assert secret1.children == []

        # Verify public1 has both public2 and internal1 children
        public1 = Enum.find(work_map, fn item -> item.id == ctx.public1.id end)

        assert length(public1.children) == 2
        internal1 = Enum.find(public1.children, fn item -> item.id == ctx.internal1.id end)
        public2 = Enum.find(public1.children, fn item -> item.id == ctx.public2.id end)

        # Verify internal1 has no children
        assert internal1.children == []

        # Verify internal2 is only child of public2
        [internal2] = public2.children
        assert internal2.id == ctx.internal2.id

        # Verify secret2 has no children
        [secret2] = internal2.children
        assert secret2.id == ctx.secret2.id
        assert secret2.children == []
      end
    end
  end
end
