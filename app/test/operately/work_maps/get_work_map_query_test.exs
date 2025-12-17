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

      assert_work_map_structure(work_map, ctx, %{
        root_goal1: %{
          project_with_goal1: []
        },
        root_goal2: %{
          project_with_goal2: []
        },
        root_project1: [],
        root_project2: []
      })
    end
  end

  describe "functionality - execute/1 with include_tasks parameter" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_company_member(:assignee)
      |> Factory.add_company_member(:other_person)
      |> Factory.add_project_task(:open_task, :milestone)
      |> Factory.add_task_assignee(:open_task_assignee, :open_task, :assignee)
      |> Factory.add_project_task(:closed_task, :milestone)
      |> Factory.add_task_assignee(:closed_task_assignee, :closed_task, :assignee)
      |> Factory.add_project_task(:other_assignee_task, :milestone)
      |> Factory.add_task_assignee(:other_assignee_task_assignee, :other_assignee_task, :other_person)
      |> then(fn ctx ->
        {:ok, closed_task} = Operately.Tasks.update_task(ctx.closed_task, %{task_status: %{id: Ecto.UUID.generate(), label: "Done", color: :green, index: 0, value: "done", closed: true}})
        Map.put(ctx, :closed_task, closed_task)
      end)
    end

    test "does not include tasks by default", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(ctx.assignee, %{company_id: ctx.company.id})

      refute Enum.any?(work_map, fn item -> item.type == :task end)
    end

    test "does not include tasks when include_tasks is false", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(ctx.assignee, %{company_id: ctx.company.id, include_tasks: false}, :flat)

      refute Enum.any?(work_map, fn item -> item.type == :task end)
    end

    test "includes only open tasks assigned to requester when include_tasks is true", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(ctx.assignee, %{company_id: ctx.company.id, include_tasks: true}, :flat)

      items_by_id = index_work_map_by_id(work_map)

      assert Map.has_key?(items_by_id, ctx.project.id)
      assert Map.has_key?(items_by_id, ctx.open_task.id)

      refute Map.has_key?(items_by_id, ctx.closed_task.id)
      refute Map.has_key?(items_by_id, ctx.other_assignee_task.id)

      project = Map.fetch!(items_by_id, ctx.project.id)
      assert project.type == :project

      open_task = Map.fetch!(items_by_id, ctx.open_task.id)
      assert open_task.type == :task
      assert open_task.parent_id == ctx.project.id
    end
  end

  describe "functionality - execute/1 with include_assignees parameter" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:member1)
      |> Factory.add_company_member(:member2)
      |> Factory.add_goal(:goal, :space, champion: :creator, reviewer: :member1)
      |> Factory.add_project(:project, :space, champion: :member2)
    end

    test "includes assignees when include_assignees is true", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{ company_id: ctx.company.id, include_assignees: true })

      # Find the goal and project
      goal = Enum.find(work_map, fn item -> item.type == :goal end)
      project = Enum.find(work_map, fn item -> item.type == :project end)

      # # Verify assignees are included
      assert goal.assignees != nil
      assert length(goal.assignees) == 2
      assert Enum.any?(goal.assignees, fn person -> person.id == ctx.creator.id end)
      assert Enum.any?(goal.assignees, fn person -> person.id == ctx.member1.id end)

      assert project.assignees != nil
      assert length(project.assignees) == 1
      assert hd(project.assignees).id == ctx.member2.id
    end

    test "does not include assignees when include_assignees is false", ctx do
      {:ok, work_map} =
        GetWorkMapQuery.execute(:system, %{
          company_id: ctx.company.id,
          include_assignees: false
        })

      # Find the goal and project
      goal = Enum.find(work_map, fn item -> item.type == :goal end)
      project = Enum.find(work_map, fn item -> item.type == :project end)

      # Verify assignees are not included
      assert goal.assignees == nil
      assert project.assignees == nil
    end

    test "does not include assignees by default", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id})

      # Find the goal and project
      goal = Enum.find(work_map, fn item -> item.type == :goal end)
      project = Enum.find(work_map, fn item -> item.type == :project end)

      # Verify assignees are not included by default
      assert goal.assignees == nil
      assert project.assignees == nil
    end
  end

  describe "functionality - execute/1 with include_reviewer parameter" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:goal_reviewer)
      |> Factory.add_company_member(:project_reviewer)
      |> Factory.add_goal(:goal, :space, champion: :creator, reviewer: :goal_reviewer)
      |> Factory.add_project(:project, :space, champion: :goal_reviewer, reviewer: :project_reviewer)
    end

    test "includes reviewer when include_reviewer is true", ctx do
      {:ok, work_map} =
        GetWorkMapQuery.execute(:system, %{
          company_id: ctx.company.id,
          include_reviewer: true
        })

      goal = Enum.find(work_map, fn item -> item.type == :goal end)
      project = Enum.find(work_map, fn item -> item.type == :project end)

      assert goal.reviewer.id == ctx.goal_reviewer.id
      assert project.reviewer.id == ctx.project_reviewer.id
    end

    test "does not include reviewer when include_reviewer is false", ctx do
      {:ok, work_map} =
        GetWorkMapQuery.execute(:system, %{
          company_id: ctx.company.id,
          include_reviewer: false
        })

      goal = Enum.find(work_map, fn item -> item.type == :goal end)
      project = Enum.find(work_map, fn item -> item.type == :project end)

      assert match?(%Ecto.Association.NotLoaded{}, goal.reviewer)
      assert match?(%Ecto.Association.NotLoaded{}, project.reviewer)
    end

    test "does not include reviewer by default", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id})

      goal = Enum.find(work_map, fn item -> item.type == :goal end)
      project = Enum.find(work_map, fn item -> item.type == :project end)

      assert match?(%Ecto.Association.NotLoaded{}, goal.reviewer)
      assert match?(%Ecto.Association.NotLoaded{}, project.reviewer)
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

    test "returns only goals and projects for the specified space", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, space_id: ctx.space1.id})

      assert_work_map_structure(work_map, ctx, %{
        goal1: [],
        project1: []
      })
    end

    test "returns only goals and projects for space2 with correct hierarchy", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, space_id: ctx.space2.id})

      assert_work_map_structure(work_map, ctx, %{
        root_goal: %{
          child_goal1: %{
            grandchild_goal: %{
              grandchild_project1: [],
              grandchild_project2: []
            }
          },
          child_goal2: []
        },
        root_project: []
      })
    end

    test "returns only projects for space3", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, space_id: ctx.space3.id})

      assert_work_map_structure(work_map, ctx, %{
        project_s3_1: [],
        project_s3_2: [],
        project_s3_3: []
      })
    end

    #
    # The next tests are for the following behavior:
    #
    # Active projects still pull their goal ancestry,
    # even if they belong to another space,
    # but when a project is closed or paused we only keep the project itself
    # unless those ancestors also live in the filtered space.
    #

    test "given parent and greatgrandchild have the same space, but child and grandchild have another space, returns full hierarchy with parent, child, grandchild and greatgrandchild", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:child, :space2, parent_goal: :goal1)
        |> Factory.add_goal(:grand_child, :space2, parent_goal: :child)
        |> Factory.add_goal(:great_grand_child, :space1, parent_goal: :grand_child)
        |> Factory.add_project(:grand_child_project, :space1, goal: :child)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, space_id: ctx.space1.id})

      assert_work_map_structure(work_map, ctx, %{
        project1: [],
        goal1: %{
          child: %{
            grand_child: %{
              great_grand_child: []
            },
            grand_child_project: []
          }
        }
      })
    end

    test "given parent and child have different spaces, returns full hierarchy including parent", ctx do
      ctx = Factory.add_goal(ctx, :child, :space1, parent_goal: :root_goal)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, space_id: ctx.space1.id})

      assert_work_map_structure(work_map, ctx, %{
        goal1: [],
        project1: [],
        root_goal: %{
          child: []
        }
      })
    end

    test "given project's parent goal has different space and project is closed, project's parent goal is not included", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:child, :space2, parent_goal: :goal1)
        |> Factory.add_project(:grand_child_project, :space1, goal: :child)
        |> Factory.close_project(:grand_child_project)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, space_id: ctx.space1.id})

      assert_work_map_structure(work_map, ctx, %{
        project1: [],
        goal1: [],
        grand_child_project: []
      })
    end

    test "given project's parent goal has different space and project is paused, project's parent goal is not included", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:child, :space2, parent_goal: :goal1)
        |> Factory.add_project(:grand_child_project, :space1, goal: :child)
        |> Factory.pause_project(:grand_child_project)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, space_id: ctx.space1.id})

      assert_work_map_structure(work_map, ctx, %{
        project1: [],
        goal1: [],
        grand_child_project: []
      })
    end

    test "given goal's parent goal has different space and goal is closed, goal's parent goal is not included", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:child, :space2, parent_goal: :goal1)
        |> Factory.add_goal(:grand_child_goal, :space1, parent_goal: :child)
        |> Factory.close_goal(:grand_child_goal)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, space_id: ctx.space1.id})

      assert_work_map_structure(work_map, ctx, %{
        project1: [],
        goal1: [],
        grand_child_goal: []
      })
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

    test "returns only child goals and projects for the specified parent goal", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, parent_goal_id: ctx.parent_goal.id})

      assert_work_map_structure(work_map, ctx, %{
        child_goal1: %{
          grandchild_goal: %{
            grandchild_project1: [],
            grandchild_project2: []
          }
        },
        child_goal2: [],
        child_project: []
      })
    end
  end

  describe "functionality - execute/1 with company_id and champion_id parameters" do
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

    test "returns only goals and projects championed by the specified person", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, champion_id: ctx.creator.id})

      assert_work_map_structure(work_map, ctx, %{
        goal1: [],
        project1: []
      })
    end

    test "given parent and greatgrandchild have the same champion, but child and grandchild have another champion, returns full hierarchy with parent, child, grandchild and greatgrandchild", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:child, :space, parent_goal: :goal1, champion: :member)
        |> Factory.add_goal(:grand_child, :space, parent_goal: :child, champion: :member)
        |> Factory.add_goal(:great_grand_child, :space, parent_goal: :grand_child, champion: :creator)
        |> Factory.add_project(:grand_child_project, :space, goal: :child, champion: :creator)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, champion_id: ctx.creator.id})

      assert_work_map_structure(work_map, ctx, %{
        project1: [],
        goal1: %{
          child: %{
            grand_child: %{
              great_grand_child: []
            },
            grand_child_project: []
          }
        }
      })
    end

    test "given parent and child have different champion, returns full hierarchy including parent", ctx do
      ctx = Factory.add_goal(ctx, :child, :space, parent_goal: :goal2, champion: :creator)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, champion_id: ctx.creator.id})

      assert_work_map_structure(work_map, ctx, %{
        goal1: [],
        project1: [],
        goal2: %{
          child: []
        }
      })
    end
  end

  describe "functionality - execute/1 with company_id and reviewer_id parameters" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:member)
      |> Factory.add_company_member(:reviewer)
      |> Factory.add_company_member(:person)

      # Create goals with different reviewers
      |> Factory.add_goal(:goal1, :space, reviewer: :reviewer, champion: :person)
      |> Factory.add_goal(:goal2, :space, reviewer: :person, champion: :reviewer)

      # Create projects with different reviewers
      |> Factory.add_project(:project1, :space, reviewer: :reviewer)
      |> Factory.add_project(:project2, :space, reviewer: :person)
    end

    test "returns only goals and projects with the specified reviewer", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, reviewer_id: ctx.reviewer.id})

      assert_work_map_structure(work_map, ctx, %{
        goal1: [],
        project1: []
      })
    end

    test "given parent and greatgrandchild have the same reviewer, but child and grandchild have another reviewer, returns full hierarchy", ctx do
      ctx =
        ctx
        |> Factory.add_goal(:child, :space, parent_goal: :goal1, reviewer: :person, champion: :reviewer)
        |> Factory.add_goal(:grand_child, :space, parent_goal: :child, reviewer: :person, champion: :reviewer)
        |> Factory.add_goal(:great_grand_child, :space, parent_goal: :grand_child, reviewer: :reviewer, champion: :person)
        |> Factory.add_project(:grand_child_project, :space, goal: :child, reviewer: :reviewer, champion: :person)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, reviewer_id: ctx.reviewer.id})

      assert_work_map_structure(work_map, ctx, %{
        project1: [],
        goal1: %{
          child: %{
            grand_child: %{
              great_grand_child: []
            },
            grand_child_project: []
          }
        }
      })
    end

    test "given parent and child have different reviewer, returns full hierarchy including parent", ctx do
      ctx = Factory.add_goal(ctx, :child, :space, parent_goal: :goal2, reviewer: :reviewer)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, reviewer_id: ctx.reviewer.id})

      assert_work_map_structure(work_map, ctx, %{
        goal1: [],
        project1: [],
        goal2: %{
          child: []
        }
      })
    end
  end

  describe "functionality - execute/1 with company_id and contributor_id parameters" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_company_member(:member)

      # Create projects with different contributors
      |> Factory.add_project(:project1, :space)
      |> Factory.add_project(:project2, :space)
      |> Factory.add_project_contributor(:contributor1, :project1, :as_person)
      |> Factory.add_project_contributor(:contributor2, :project2, :as_person)

      |> Factory.add_goal(:parent_goal, :space)
    end

    test "returns only projects with the specified contributor", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, contributor_id: ctx.contributor1.id})

      assert_work_map_structure(work_map, ctx, %{
        project1: []
      })
    end

    test "given parent goal with child projects having different contributors, returns full hierarchy", ctx do
      # Create projects under the goal with different contributors
      ctx = ctx
        |> Factory.add_project(:child_project1, :space, goal: :parent_goal)
        |> Factory.add_project(:child_project2, :space, goal: :parent_goal)
        |> Factory.add_project_contributor(:goal_contributor1, :child_project1, :as_person)
        |> Factory.add_project_contributor(:goal_contributor2, :child_project2, :as_person)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, contributor_id: ctx.goal_contributor1.id})

      # When filtering by contributor_id, we should only see projects with that contributor (and their parent goals)
      assert_work_map_structure(work_map, ctx, %{
        parent_goal: %{
          child_project1: []
        }
      })
    end

    test "with nested hierarchy, maintains parent path to matching items", ctx do
      # Create a more complex hierarchy with nested goals and projects
      ctx = ctx
        |> Factory.add_goal(:child_goal, :space, parent_goal: :parent_goal)
        |> Factory.add_project(:nested_project, :space, goal: :child_goal)
        |> Factory.add_project_contributor(:nested_contributor, :nested_project, :as_person)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, contributor_id: ctx.nested_contributor.id})

      # When filtering by contributor_id, we should only see projects with that contributor (and their parent goals)
      assert_work_map_structure(work_map, ctx, %{
        parent_goal: %{
          child_goal: %{
            nested_project: []
          }
        }
      })
    end

    test "does not return projects in which the contributor is the reviewer", ctx do
      ctx = Factory.add_project(ctx, :project3, :space, reviewer: :contributor1)

      {:ok, work_map} = GetWorkMapQuery.execute(:system, %{company_id: ctx.company.id, contributor_id: ctx.contributor1.id})
      assert_work_map_structure(work_map, ctx, %{
        project1: []
      })
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

      assert_work_map_structure(work_map, ctx, %{
        root_goal: %{
          root_project: [],
          level1_goal: %{
            level1_project: [],
            level2_goal: %{
              level2_project: []
            }
          },
          level1_goal2: %{
            level1_project2: []
          }
        }
      })
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

      # child_goal1 has 2 projects, but :creator contributes to only one of them
      |> Factory.add_project(:child_project1, :space1, goal: :child_goal1, champion: :member)
      |> Factory.add_project(:child_project2, :space1, goal: :child_goal1, champion: :member)
      |> Factory.add_project_contributor(:creator, :child_project1, :as_person)

      # Create goals in space2
      |> Factory.add_goal(:parent_goal2, :space2, champion: :creator)
      |> Factory.add_goal(:child_goal3, :space2, parent_goal: :parent_goal2, champion: :creator)

      # Create projects
      |> Factory.add_project(:project1, :space1, goal: :parent_goal1, champion: :creator)
      |> Factory.add_project(:project2, :space1, goal: :parent_goal1, champion: :member)
    end

    test "filters correctly with all parameters", ctx do
      {:ok, work_map} =
        GetWorkMapQuery.execute(:system, %{
          company_id: ctx.company.id,
          space_id: ctx.space1.id,
          parent_goal_id: ctx.parent_goal1.id,
          champion_id: ctx.creator.id,
          contributor_id: ctx.creator.id
        })

      assert_work_map_structure(work_map, ctx, %{
        child_goal1: %{
          child_project1: []
        },
        project1: []
      })
    end

    test "filters correctly with only_completed", ctx do
      {:ok, work_map} =
        GetWorkMapQuery.execute(:system, %{
          company_id: ctx.company.id,
          space_id: ctx.space1.id,
          parent_goal_id: ctx.parent_goal1.id,
          champion_id: ctx.creator.id,
          contributor_id: ctx.creator.id,
          only_completed: true
        })

      assert_work_map_structure(work_map, ctx, %{})

      ctx
      |> Factory.close_goal(:child_goal1)
      |> Factory.close_project(:child_project1)

      {:ok, work_map} =
        GetWorkMapQuery.execute(:system, %{
          company_id: ctx.company.id,
          space_id: ctx.space1.id,
          parent_goal_id: ctx.parent_goal1.id,
          champion_id: ctx.creator.id,
          contributor_id: ctx.creator.id,
          only_completed: true
        })

      assert_work_map_structure(work_map, ctx, %{
        child_goal1: %{
          child_project1: []
        }
      })
    end
  end

  describe "functionality - Project progress is calculated correctly" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone1, :project)
      |> Factory.add_project_milestone(:milestone2, :project)
      |> Factory.add_project_milestone(:milestone3, :project)
    end

    test "0% progress", ctx do
      {:ok, [project]} = GetWorkMapQuery.execute(:system, %{ company_id: ctx.company.id })

      assert project.progress == 0
    end

    test "100% progress", ctx do
      ctx
      |> Factory.close_project_milestone(:milestone1)
      |> Factory.close_project_milestone(:milestone2)
      |> Factory.close_project_milestone(:milestone3)

      {:ok, [project]} = GetWorkMapQuery.execute(:system, %{ company_id: ctx.company.id })

      assert project.progress == 100
    end

    test "66% progress", ctx do
      ctx
      |> Factory.close_project_milestone(:milestone1)
      |> Factory.close_project_milestone(:milestone2)

      {:ok, [project]} = GetWorkMapQuery.execute(:system, %{ company_id: ctx.company.id })

      assert floor(project.progress) == 66
    end
  end

  describe "permissions - query root projects" do
    @table [
      %{person: :company_member, count: 1, expected_projects: [:public_project]},
      %{person: :space_member, count: 3, expected_projects: [:public_project, :project1, :project2]},
      %{person: :creator, count: 4, expected_projects: [:public_project, :project1, :project2, :secret_project]},
      %{person: :champion, count: 4, expected_projects: [:public_project, :project1, :project2, :secret_project]}
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
      |> Factory.add_project(:secret_project, :space,
        champion: :champion,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
    end

    tabletest @table do
      test "#{@test.person} has access to #{Enum.map_join(@test.expected_projects, ", ", &Atom.to_string/1)}", ctx do
        expected_projects = Enum.map(@test.expected_projects, &ctx[&1].id)
        {:ok, work_map} = GetWorkMapQuery.execute(ctx[@test.person], %{company_id: ctx.company.id})

        assert length(work_map) == @test.count

        Enum.each(work_map, fn item ->
          assert Enum.member?(expected_projects, item.id)
        end)
      end
    end
  end

  describe "permissions - query nested projects" do
    @table [
      %{person: :company_member, count: 1, expected_projects: [:public_project]},
      %{person: :space_member, count: 3, expected_projects: [:public_project, :project1, :project2]},
      %{person: :creator, count: 4, expected_projects: [:public_project, :project1, :project2, :secret_project]},
      %{person: :champion, count: 4, expected_projects: [:public_project, :project1, :project2, :secret_project]}
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
      |> Factory.add_project(:secret_project, :space,
        goal: :child_goal,
        champion: :champion,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
    end

    tabletest @table do
      test "#{@test.person} has access to #{Enum.map_join(@test.expected_projects, ", ", &Atom.to_string/1)}", ctx do
        {:ok, [parent_goal]} = GetWorkMapQuery.execute(ctx[@test.person], %{company_id: ctx.company.id})
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
      |> Factory.add_goal(:secret1, :space,
        champion: :champion,
        company_access: Binding.no_access(),
        space_access: Binding.no_access()
      )
      |> Factory.add_goal(:secret2, :space,
        parent_goal: :internal2,
        champion: :champion,
        company_access: Binding.no_access(),
        space_access: Binding.no_access()
      )
    end

    test "company member has access to 2 public goals", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(ctx.company_member, %{company_id: ctx.company.id})

      assert_work_map_structure(work_map, ctx, %{
        public1: %{
          public2: []
        }
      })
    end

    test "space member has access to 4 public and internal goals", ctx do
      {:ok, work_map} = GetWorkMapQuery.execute(ctx.space_member, %{company_id: ctx.company.id})

      assert_work_map_structure(work_map, ctx, %{
        public1: %{
          public2: %{
            internal2: []
          },
          internal1: []
        },
      })
    end

    @table [
      %{person: :creator},
      %{person: :champion}
    ]

    tabletest @table do
      test "#{@test.person} has access to 6 public, internal and secret goals", ctx do
        {:ok, work_map} = GetWorkMapQuery.execute(ctx[@test.person], %{company_id: ctx.company.id})

        assert_work_map_structure(work_map, ctx, %{
          public1: %{
            public2: %{
              internal2: %{
                secret2: []
              }
            },
            internal1: []
          },
          secret1: []
        })
      end
    end
  end

  describe "handling edge cases" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space)
    end

    test "returns empty list when company_id is nil", ctx do
      result = GetWorkMapQuery.execute(ctx.creator, %{company_id: nil})

      assert {:ok, work_map} = result
      assert work_map == []
    end

    test "returns empty list when person is nil", ctx do
      result = GetWorkMapQuery.execute(nil, %{company_id: ctx.company.id})

      assert {:ok, work_map} = result
      assert work_map == []
    end

    test "returns empty list for non-existent company", ctx do
      non_existent_company_id = Ecto.UUID.generate()
      {:ok, work_map} = GetWorkMapQuery.execute(ctx.creator, %{company_id: non_existent_company_id})

      assert work_map == []
    end
  end

  #
  # Helpers
  #

  defp assert_work_map_structure(work_map, ctx, expected_structure) do
    expected_root_ids = Map.keys(expected_structure) |> Enum.map(fn key -> ctx[key].id end)
    actual_root_ids = Enum.map(work_map, & &1.id)

    assert Enum.sort(actual_root_ids) == Enum.sort(expected_root_ids), "Root nodes do not match expected structure. Expected: #{inspect(expected_root_ids)}, Got: #{inspect(actual_root_ids)}"

    # Build a map of all items by id for easier lookup
    items_by_id = index_work_map_by_id(work_map)

    # Recursively check each expected node and its children
    Enum.each(expected_structure, fn {node_key, expected_children} ->
      node_id = ctx[node_key].id
      node = Map.get(items_by_id, node_id)

      assert node, "Expected node #{inspect(node_key)} (ID: #{node_id}) not found in work map"

      case expected_children do
        [] ->
          assert node.children == [], "Expected node #{inspect(node_key)} to have no children"

        children ->
          actual_child_ids = Enum.map(node.children, & &1.id) |> Enum.sort()
          expected_child_ids = Map.keys(children) |> Enum.map(fn key -> ctx[key].id end) |> Enum.sort()

          assert actual_child_ids == expected_child_ids,
                 "Children of node #{inspect(node_key)} do not match. " <>
                 "Expected: #{inspect(expected_child_ids)}, Got: #{inspect(actual_child_ids)}"

          # Recursively check each child's structure
          Enum.each(node.children, fn child ->
            child_key = find_key_for_id(child.id, ctx)
            child_children = Map.get(children, child_key)
            assert_child_structure(child, child_children, ctx, items_by_id)
          end)
      end
    end)
  end

  # Helper to assert a child node's structure
  defp assert_child_structure(node, expected_children, ctx, items_by_id) do
    case expected_children do
      [] ->
        assert node.children == [], "Expected node #{node.id} to have no children"

      children when is_map(children) and map_size(children) > 0 ->
        actual_child_ids = Enum.map(node.children, & &1.id) |> Enum.sort()
        expected_child_ids = Map.keys(children) |> Enum.map(fn key -> ctx[key].id end) |> Enum.sort()

        assert actual_child_ids == expected_child_ids,
               "Children of node #{node.id} do not match. " <>
               "Expected: #{inspect(expected_child_ids)}, Got: #{inspect(actual_child_ids)}"

        # Recursively check each child's structure
        Enum.each(node.children, fn child ->
          child_key = find_key_for_id(child.id, ctx)
          child_children = Map.get(children, child_key)
          assert_child_structure(child, child_children, ctx, items_by_id)
        end)
    end
  end

  defp find_key_for_id(id, ctx) do
    Enum.find_value(ctx, fn {key, value} ->
      if is_map(value) && Map.has_key?(value, :id) && value.id == id, do: key, else: nil
    end)
  end

  # Helper to build a map of all items in the work map by ID
  defp index_work_map_by_id(work_map) do
    flatten_for_index(work_map, %{})
  end

  # Non-recursive approach to flatten a tree and create an ID -> item mapping
  defp flatten_for_index(items, acc) when is_list(items) do
    items
    |> Enum.reduce(acc, fn item, acc ->
      acc = Map.put(acc, item.id, item)

      if item.children && length(item.children) > 0 do
        flatten_for_index(item.children, acc)
      else
        acc
      end
    end)
  end
end
