defmodule OperatelyWeb.Api.Companies.ListActivitiesTest do
  use OperatelyWeb.TurboCase

  import Ecto.Query, only: [from: 2]
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Access.Binding
  alias Operately.Operations.ResourceHubDocumentCreating
  alias Operately.Support.RichText
  alias OperatelyWeb.Paths
  alias Operately.Activities.Activity
  alias Operately.ResourceHubs.Node

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, [:companies, :list_activities], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)

      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      space = group_fixture(champion)

      attrs = %{
        scope_type: "company",
        scope_id: Paths.company_id(ctx.company),
        actions: ["goal_created"]
      }

      Map.merge(ctx, %{space: space, champion: champion, reviewer: reviewer, attrs: attrs})
    end

    test "company members have no access", ctx do
      goal_fixture(ctx.champion, %{
        space_id: ctx.company.company_space_id,
        company_access_level: Binding.no_access(),
      })

      assert {200, res} = query(ctx.conn, [:companies, :list_activities], ctx.attrs)

      assert res.activities == []
    end

    test "company members have access", ctx do
      goal = goal_fixture(ctx.champion, %{
        space_id: ctx.company.company_space_id,
        company_access_level: Binding.view_access(),
      })

      assert {200, %{ activities: activities } = _res} = query(ctx.conn, [:companies, :list_activities], ctx.attrs)

      assert length(activities) == 1
      assert Paths.goal_id(goal) == hd(activities).content.goal.id
    end

    test "space members have no access", ctx do
      Groups.add_members(ctx.champion, ctx.space.id, [%{id: ctx.person.id, access_level: Binding.edit_access()}])
      goal_fixture(ctx.champion, %{
        space_id: ctx.space.id,
        space_access_level: Binding.no_access(),
        company_access_level: Binding.no_access(),
      })

      assert {200, res} = query(ctx.conn, [:companies, :list_activities], ctx.attrs)

      assert res.activities == []
    end

    test "space members have access", ctx do
      Groups.add_members(ctx.champion, ctx.space.id, [%{id: ctx.person.id, access_level: Binding.edit_access()}])
      goal = goal_fixture(ctx.champion, %{
        space_id: ctx.space.id,
        space_access_level: Binding.view_access(),
        company_access_level: Binding.no_access(),
      })

      assert {200, %{ activities: activities } = _res} = query(ctx.conn, [:companies, :list_activities], ctx.attrs)

      assert length(activities) == 1
      assert Paths.goal_id(goal) == hd(activities).content.goal.id
    end

    test "reviewers have access", ctx do
      goal = goal_fixture(ctx.champion, %{
        space_id: ctx.space.id,
        reviewer_id: ctx.reviewer.id,
        space_access_level: Binding.no_access(),
        company_access_level: Binding.no_access(),
      })

      account = Repo.preload(ctx.reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, %{ activities: activities } = _res} = query(conn, [:companies, :list_activities], ctx.attrs)

      assert length(activities) == 1
      assert Paths.goal_id(goal) == hd(activities).content.goal.id
    end

    test "champions have access", ctx do
      goal = goal_fixture(ctx.reviewer, %{
        space_id: ctx.space.id,
        champion_id: ctx.champion.id,
        space_access_level: Binding.no_access(),
        company_access_level: Binding.no_access(),
      })

      account = Repo.preload(ctx.champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, %{ activities: activities } = _res} = query(conn, [:companies, :list_activities], ctx.attrs)

      assert length(activities) == 1
      assert Paths.goal_id(goal) == hd(activities).content.goal.id
    end
  end

  describe "permission query regressions" do
    setup ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_person(:creator) |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
      activity = Repo.get_by!(Activity, author_id: ctx.creator.id, action: "goal_created")
      Map.merge(ctx, %{activity: activity, attrs: %{scope_type: :company, scope_id: Paths.company_id(ctx.company), actions: ["goal_created"], paginate: true}})
    end

    test "overlapping permission paths fill pages with distinct activities", ctx do
      activities = populate_activities(ctx.activity, 21)
      bindings = from b in Binding,
        join: g in assoc(b, :group),
        join: m in assoc(g, :memberships),
        where: b.context_id == ^ctx.activity.access_context_id and m.person_id == ^ctx.creator.id and b.access_level >= ^Binding.view_access()
      assert Repo.aggregate(bindings, :count) > 1

      assert {200, first} = query(ctx.conn, [:companies, :list_activities], ctx.attrs)
      assert length(first.activities) == 20
      assert {200, second} = query(ctx.conn, [:companies, :list_activities], Map.put(ctx.attrs, :cursor, first.next_cursor))
      assert length(second.activities) == 1
      assert second.next_cursor == nil
      assert Enum.map(first.activities ++ second.activities, & &1.id) == Enum.map(activities, &Paths.activity_id/1)
    end

    test "visibility requires at least view access", ctx do
      bindings = from b in Binding, where: b.context_id == ^ctx.activity.access_context_id
      Repo.update_all(bindings, set: [access_level: Binding.minimal_access()])
      assert feed_ids(ctx.creator, ctx.attrs) == []

      for level <- [Binding.view_access(), Binding.edit_access()] do
        Repo.update_all(bindings, set: [access_level: level])
        assert feed_ids(ctx.creator, ctx.attrs) == [ctx.activity.id]
      end
    end

    test "suspended requesters cannot use existing memberships", ctx do
      assert feed_ids(ctx.creator, ctx.attrs) == [ctx.activity.id]
      ctx.creator |> Ecto.Changeset.change(suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)) |> Repo.update!()
      assert feed_ids(ctx.creator, ctx.attrs) == []
    end

    test "requesters without memberships cannot see activities", ctx do
      Repo.delete_all(from m in Operately.Access.GroupMembership, where: m.person_id == ^ctx.creator.id)
      assert feed_ids(ctx.creator, ctx.attrs) == []
    end

    test "activities without access contexts are excluded", ctx do
      copy_activity(%{ctx.activity | access_context_id: nil}, ctx.activity.inserted_at)
      assert feed_ids(ctx.creator, ctx.attrs) == [ctx.activity.id]
    end

    test "guests see a resource only after receiving a direct binding", ctx do
      ctx = Factory.add_outside_collaborator(ctx, :guest, :creator)
      assert feed_ids(ctx.guest, ctx.attrs) == []
      group = Operately.Access.get_group!(person_id: ctx.guest.id)
      {:ok, _} = Operately.Access.create_binding(%{context_id: ctx.activity.access_context_id, group_id: group.id, access_level: Binding.view_access()})
      assert feed_ids(ctx.guest, ctx.attrs) == [ctx.activity.id]
    end

    test "foreign company and resource scopes do not bypass company isolation", ctx do
      foreign = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
      foreign_activity = Repo.get_by!(Activity, author_id: foreign.creator.id, action: "goal_created")
      group = Operately.Access.get_group!(person_id: ctx.creator.id)
      {:ok, _} = Operately.Access.create_binding(%{context_id: foreign_activity.access_context_id, group_id: group.id, access_level: Binding.view_access()})

      for {scope, id} <- [{:company, Paths.company_id(foreign.company)}, {:goal, Paths.goal_id(foreign.goal)}] do
        assert {200, %{activities: [], next_cursor: nil}} = query(ctx.conn, [:companies, :list_activities], %{ctx.attrs | scope_type: scope, scope_id: id})
      end
    end

    test "person scope filters by author", ctx do
      ctx = Factory.add_company_member(ctx, :member)
      other = copy_activity(%{ctx.activity | author_id: ctx.member.id}, ctx.activity.inserted_at)
      assert {200, response} = query(ctx.conn, [:companies, :list_activities], %{ctx.attrs | scope_type: :person, scope_id: Paths.person_id(ctx.member)})
      assert Enum.map(response.activities, & &1.id) == [Paths.activity_id(other)]
    end

    test "deprecated actions stay excluded with empty or explicit action filters", ctx do
      deprecated = hd(Activity.deprecated_actions())
      copy = copy_activity(%{ctx.activity | action: deprecated}, ctx.activity.inserted_at)
      refute copy.id in feed_ids(ctx.creator, %{ctx.attrs | actions: []})
      assert feed_ids(ctx.creator, %{ctx.attrs | actions: [deprecated]}) == []
      assert feed_ids(ctx.creator, %{ctx.attrs | actions: [deprecated, "goal_created"]}) == [ctx.activity.id]
    end

    test "file creation with any deleted node in its array is excluded", ctx do
      ctx = ctx |> Factory.add_resource_hub(:hub, :goal, :creator) |> Factory.add_file(:file, :hub) |> Factory.add_file(:deleted_file, :hub)
      content = %{"company_id" => ctx.company.id, "space_id" => ctx.space.id, "goal_id" => ctx.goal.id, "resource_hub_id" => ctx.hub.id,
        "files" => [%{"file_id" => ctx.file.id, "node_id" => ctx.file.node_id}, %{"file_id" => ctx.deleted_file.id, "node_id" => ctx.deleted_file.node_id}]}
      activity = copy_activity(%{ctx.activity | action: "resource_hub_file_created", content: content}, ctx.activity.inserted_at)
      attrs = %{ctx.attrs | actions: ["resource_hub_file_created"]}
      assert {200, before_deletion} = query(ctx.conn, [:companies, :list_activities], attrs)
      assert Enum.any?(before_deletion.activities, &(&1.id == Paths.activity_id(activity)))

      Repo.soft_delete!(Repo.get!(Node, ctx.deleted_file.node_id))
      assert {200, after_deletion} = query(ctx.conn, [:companies, :list_activities], attrs)
      refute Enum.any?(after_deletion.activities, &(&1.id == Paths.activity_id(activity)))
    end
  end

  describe "activity scope types" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_project(:project, :space)
      |> create_milestone()
      |> create_task()
    end

    test "company scope includes all activities", ctx do
      assert {200, res} = query(ctx.conn, [:companies, :list_activities], %{
        scope_type: :company,
        scope_id: Paths.company_id(ctx.company),
        actions: []
      })

      assert Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      assert Enum.find(res.activities, fn act -> act.action == "space_added" end)
      assert Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "space scope includes space, goal, project, and task activities", ctx do
      assert {200, res} = query(ctx.conn, [:companies, :list_activities], %{
        scope_type: :space,
        scope_id: Paths.space_id(ctx.space),
        actions: []
      })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      assert Enum.find(res.activities, fn act -> act.action == "space_added" end)
      assert Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "project scope includes project and task activities", ctx do
      assert {200, res} = query(ctx.conn, [:companies, :list_activities], %{
        scope_type: :project,
        scope_id: Paths.project_id(ctx.project),
        actions: []
      })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      refute Enum.find(res.activities, fn act -> act.action == "space_added" end)
      refute Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "goal scope includes only goal activities", ctx do
      assert {200, res} = query(ctx.conn, [:companies, :list_activities], %{
        scope_type: :goal,
        scope_id: Paths.goal_id(ctx.goal),
        actions: []
      })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      refute Enum.find(res.activities, fn act -> act.action == "space_added" end)
      assert Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      refute Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "milestone scope includes only milestone activities", ctx do
      assert {200, res} = query(ctx.conn, [:companies, :list_activities], %{
        scope_type: :milestone,
        scope_id: Paths.milestone_id(ctx.milestone),
        actions: []
      })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      refute Enum.find(res.activities, fn act -> act.action == "space_added" end)
      refute Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_created" end)
      assert Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    test "task scope includes only task activities", ctx do
      assert {200, res} = query(ctx.conn, [:companies, :list_activities], %{
        scope_type: :task,
        scope_id: Paths.task_id(ctx.task),
        actions: []
      })

      refute Enum.find(res.activities, fn act -> act.action == "company_adding" end)
      refute Enum.find(res.activities, fn act -> act.action == "space_added" end)
      refute Enum.find(res.activities, fn act -> act.action == "goal_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_created" end)
      refute Enum.find(res.activities, fn act -> act.action == "project_milestone_creation" end)
      assert Enum.find(res.activities, fn act -> act.action == "task_adding" end)
    end

    for scope <- [:task, :milestone] do
      test "#{scope} timelines return more than 100 activities without pagination", ctx do
        activity = Repo.get_by!(Activity, author_id: ctx.creator.id, action: "task_adding")
        activities = populate_activities(activity, 101)

        assert {200, response} = query(ctx.conn, [:companies, :list_activities], %{
          scope_type: unquote(scope),
          scope_id: scope_id(ctx, unquote(scope)),
          actions: ["task_adding"]
        })

        assert Enum.map(response.activities, & &1.id) == Enum.map(activities, &Paths.activity_id/1)
        assert response.next_cursor == nil
      end
    end

    test "task assignee activity with assignee id arrays can be listed", ctx do
      attrs = %{
        action: "task_assignee_updating",
        author_id: ctx.creator.id,
        access_context_id: ctx.project.access_context.id,
        content: %{
          "company_id" => ctx.company.id,
          "space_id" => ctx.space.id,
          "project_id" => ctx.project.id,
          "milestone_id" => ctx.milestone.id,
          "task_id" => ctx.task.id,
          "old_assignee_id" => nil,
          "new_assignee_id" => ctx.creator.id,
          "old_assignee_ids" => [],
          "new_assignee_ids" => [ctx.creator.id],
          "added_assignee_ids" => [ctx.creator.id],
          "removed_assignee_ids" => []
        }
      }

      {:ok, _} = Repo.insert(struct(Activity, attrs))

      assert {200, res} = query(ctx.conn, [:companies, :list_activities], %{
        scope_type: :company,
        scope_id: Paths.company_id(ctx.company),
        actions: ["task_assignee_updating"]
      })

      assert [%{action: "task_assignee_updating"}] = res.activities
    end

    test "resource hub activities for deleted resources are not listed", ctx do
      ctx =
        ctx
        |> Factory.preload(:space, :access_context)
        |> Factory.add_resource_hub(:resource_hub, :space, :creator)
        |> Factory.add_document(:document, :resource_hub)

      attrs = %{
        action: "resource_hub_document_created",
        author_id: ctx.creator.id,
        access_context_id: ctx.space.access_context.id,
        content: %{
          "company_id" => ctx.company.id,
          "space_id" => ctx.space.id,
          "resource_hub_id" => ctx.resource_hub.id,
          "node_id" => ctx.document.node_id,
          "document_id" => ctx.document.id,
          "name" => "Deleted document"
        }
      }

      {:ok, _} = Repo.insert(struct(Activity, attrs))
      {:ok, _} = Repo.soft_delete(ctx.document)
      {:ok, _} = Repo.soft_delete(Repo.get!(Node, ctx.document.node_id))

      assert {200, res} = query(ctx.conn, [:companies, :list_activities], %{
        scope_type: :company,
        scope_id: Paths.company_id(ctx.company),
        actions: ["resource_hub_document_created"]
      })

      assert res.activities == []
    end

    test "goal-backed resource hub activities serialize the goal parent", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:goal_member)
        |> Factory.add_goal(:private_goal, :space,
          champion: :goal_member,
          reviewer: :goal_member,
          company_access: Binding.no_access(),
          space_access: Binding.no_access()
        )
        |> Factory.add_resource_hub(:goal_hub, :private_goal, :creator)

      {:ok, document} =
        ResourceHubDocumentCreating.run(ctx.creator, ctx.goal_hub, %{
          name: "Goal doc",
          content: RichText.rich_text("Content"),
          post_as_draft: false,
          send_to_everyone: false,
          subscription_parent_type: :resource_hub_document,
          subscriber_ids: [],
        })

      assert document.id

      assert {200, res} = query(ctx.conn, [:companies, :list_activities], %{
        scope_type: :company,
        scope_id: Paths.company_id(ctx.company),
        actions: ["resource_hub_document_created"]
      })

      assert Enum.any?(res.activities, fn activity ->
               activity.action == "resource_hub_document_created" and
                 activity.content.goal.id == Paths.goal_id(ctx.private_goal) and
                 activity.content.project == nil
             end)
    end
  end

  describe "pagination" do
    setup ctx do
      ctx = ctx |> Factory.setup() |> Factory.log_in_person(:creator) |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
      activity = Repo.get_by!(Activity, author_id: ctx.creator.id, action: "goal_created")
      Map.merge(ctx, %{activity: activity, attrs: %{scope_type: :company, scope_id: Paths.company_id(ctx.company), actions: ["goal_created"], paginate: true}})
    end

    test "returns all activities when pagination is omitted or disabled", ctx do
      activities = populate_activities(ctx.activity, 101)

      for attrs <- [Map.delete(ctx.attrs, :paginate), Map.put(ctx.attrs, :paginate, false)] do
        assert {200, response} = query(ctx.conn, [:companies, :list_activities], attrs)
        assert Enum.map(response.activities, & &1.id) == Enum.map(activities, &Paths.activity_id/1)
        assert response.next_cursor == nil
      end
    end

    test "empty results have no continuation", ctx do
      assert {200, %{activities: [], next_cursor: nil}} = query(ctx.conn, [:companies, :list_activities], %{ctx.attrs | actions: ["goal_closing"]})
    end

    for count <- [1, 19, 20] do
      test "#{count} activities fit in one page", ctx do
        populate_activities(ctx.activity, unquote(count))
        assert {200, page} = query(ctx.conn, [:companies, :list_activities], ctx.attrs)
        assert length(page.activities) == unquote(count)
        assert page.next_cursor == nil
      end
    end

    test "pages through tied timestamps without omissions or duplicates", ctx do
      activities = populate_activities(ctx.activity, 41, tied: true)
      assert {200, first} = query(ctx.conn, [:companies, :list_activities], ctx.attrs)
      assert {200, second} = query(ctx.conn, [:companies, :list_activities], Map.put(ctx.attrs, :cursor, first.next_cursor))
      assert {200, last} = query(ctx.conn, [:companies, :list_activities], Map.put(ctx.attrs, :cursor, second.next_cursor))

      assert Enum.map([first, second, last], &length(&1.activities)) == [20, 20, 1]
      assert last.next_cursor == nil
      expected = activities |> Enum.sort_by(& &1.id, :desc) |> Enum.map(&Paths.activity_id/1)
      assert Enum.map(first.activities ++ second.activities ++ last.activities, & &1.id) == expected
    end

    test "new activities and deletion of the cursor activity do not shift the next page", ctx do
      activities = populate_activities(ctx.activity, 21)
      assert {200, first} = query(ctx.conn, [:companies, :list_activities], ctx.attrs)
      boundary = Enum.at(activities, 19)
      Repo.delete!(boundary)
      copy_activity(ctx.activity, NaiveDateTime.add(ctx.activity.inserted_at, 60))

      assert {200, second} = query(ctx.conn, [:companies, :list_activities], Map.put(ctx.attrs, :cursor, first.next_cursor))
      assert Enum.map(second.activities, & &1.id) == [Paths.activity_id(List.last(activities))]
      assert second.next_cursor == nil
    end

    test "subsequent pages still apply scope, action, company, and access filters", ctx do
      activities = populate_activities(ctx.activity, 21)
      ctx = ctx |> Factory.add_company_member(:member) |> Factory.log_in_person(:member)
      attrs = %{ctx.attrs | scope_type: :goal, scope_id: Paths.goal_id(ctx.goal)}
      assert {200, first} = query(ctx.conn, [:companies, :list_activities], attrs)

      ctx = Factory.add_goal(ctx, :private_goal, :space, company_access: Binding.no_access(), space_access: Binding.no_access())
      private_activity = Repo.all(Activity) |> Enum.find(&(&1.content["goal_id"] == ctx.private_goal.id))
      older = NaiveDateTime.add(ctx.activity.inserted_at, -200)
      copy_activity(private_activity, older)
      copy_activity(%{ctx.activity | action: "goal_closing"}, older)
      copy_activity(%{ctx.activity | content: Map.put(ctx.activity.content, "company_id", Ecto.UUID.generate())}, older)

      assert {200, second} = query(ctx.conn, [:companies, :list_activities], Map.put(attrs, :cursor, first.next_cursor))
      assert Enum.map(second.activities, & &1.id) == [Paths.activity_id(List.last(activities))]
      assert {200, company_page} = query(ctx.conn, [:companies, :list_activities], Map.put(ctx.attrs, :cursor, first.next_cursor))
      assert Enum.map(company_page.activities, & &1.id) == [Paths.activity_id(List.last(activities))]
    end

    test "rejects malformed cursors", ctx do
      invalid = [
        "not-base64!",
        Base.url_encode64("not-json", padding: false),
        cursor(%{}),
        cursor(%{inserted_at: "bad", id: ctx.activity.id}),
        cursor(%{inserted_at: NaiveDateTime.to_iso8601(ctx.activity.inserted_at), id: "bad"})
      ]

      for value <- invalid do
        assert {400, _} = query(ctx.conn, [:companies, :list_activities], Map.put(ctx.attrs, :cursor, value))
      end
    end
  end

  defp feed_ids(person, inputs) do
    {:ok, scope_id} = OperatelyWeb.Api.Companies.ListActivities.decode_scope_id(inputs)
    OperatelyWeb.Api.Companies.ListActivities.build_query(person, scope_id, inputs) |> Repo.all() |> Enum.map(& &1.id)
  end

  defp populate_activities(activity, count, opts \\ []) do
    copies =
      for index <- Enum.drop(0..(count - 1), 1) do
        timestamp = if opts[:tied], do: activity.inserted_at, else: NaiveDateTime.add(activity.inserted_at, -index)
        copy_activity(activity, timestamp)
      end

    [activity | copies]
  end

  defp copy_activity(activity, timestamp) do
    %Activity{
      author_id: activity.author_id,
      action: activity.action,
      content: activity.content,
      access_context_id: activity.access_context_id,
      inserted_at: timestamp,
      updated_at: timestamp
    }
    |> Repo.insert!()
  end

  defp cursor(value), do: value |> Jason.encode!() |> Base.url_encode64(padding: false)

  defp scope_id(ctx, :task), do: Paths.task_id(ctx.task)
  defp scope_id(ctx, :milestone), do: Paths.milestone_id(ctx.milestone)

  defp create_milestone(ctx) do
    ctx =
      ctx
      |> Factory.preload(:project, :access_context)
      |> Factory.add_project_milestone(:milestone, :project)

    attrs = %{
      action: "project_milestone_creation",
      author_id: ctx.creator.id,
      access_context_id: ctx.project.access_context.id,
      content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "project_id" => ctx.project.id,
        "milestone_id" => ctx.milestone.id,
        "milestone_name" => ctx.milestone.title,
      }
    }

    {:ok, _} = Repo.insert(struct(Activity, attrs))

    ctx
  end

  defp create_task(ctx) do
    ctx = Factory.add_project_task(ctx, :task, :milestone)

    attrs = %{
      action: "task_adding",
      author_id: ctx.creator.id,
      access_context_id: ctx.project.access_context.id,
      content: %{
        "company_id" => ctx.company.id,
        "space_id" => ctx.space.id,
        "project_id" => ctx.project.id,
        "milestone_id" => ctx.milestone.id,
        "task_id" => ctx.task.id,
        "name" => ctx.task.name,
      }
    }

    {:ok, _} = Repo.insert(struct(Activity, attrs))

    ctx
  end
end
