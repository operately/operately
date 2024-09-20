defmodule Operately.Operations.CommentAddingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures

  alias Operately.Groups
  alias Operately.Support.{Factory, RichText}
  alias Operately.Access.Binding
  alias Operately.Operations.{GoalCheckIn, ProjectCheckIn, CommentAdding}

  setup ctx do
    ctx
    |> Factory.setup()
  end

  describe "Commenting on check-in" do
    setup ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        creator_is_contributor: "no",
        champion_id: champion.id,
        reviewer_id: reviewer.id,
        group_id: ctx.company.company_space_id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access(),
      })

      Enum.each(1..3, fn _ ->
        person = person_fixture_with_account(%{company_id: ctx.company.id})
        contributor_fixture(ctx.creator, %{project_id: project.id, person_id: person.id})
      end)
      contribs = Operately.Projects.list_project_contributors(project)

      Map.merge(ctx, %{
        champion: champion,
        reviewer: reviewer,
        project: project,
        contribs: contribs,
      })
    end

    test "Commenting on check-in notifies everyone", ctx do
      {:ok, check_in} = ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        content: RichText.rich_text("Some description"),
        send_to_everyone: false,
        subscriber_ids: Enum.map(ctx.contribs, &(&1.person_id)),
        subscription_parent_type: :project_check_in
      })

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.champion, check_in, "project_check_in", RichText.rich_text("Some comment"))
      end)
      action = "project_check_in_commented"
      activity = get_activity(comment, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 4 == notifications_count(action: action) # 3 contribs + reviewer

      ctx.contribs
      |> Enum.filter(&(&1.person_id != ctx.champion.id))
      |> Enum.each(fn contrib ->
        assert Enum.find(notifications, &(&1.person_id == contrib.person_id))
      end)
    end

    test "Mentioned person is notified", ctx do
      {:ok, check_in} = ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        content: RichText.rich_text("Some description"),
        send_to_everyone: false,
        subscriber_ids: [ctx.champion.id],
        subscription_parent_type: :project_check_in
      })

      # Without permissions
      person = person_fixture_with_account(%{company_id: ctx.company.id})
      content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

      {:ok, comment} = CommentAdding.run(ctx.champion, check_in, "project_check_in", content)

      action = "project_check_in_commented"
      activity = get_activity(comment, action)

      assert notifications_count(action: action) == 0
      assert fetch_notifications(activity.id, action: action) == []

      # With permissions
      contributor_fixture(ctx.creator, %{project_id: ctx.project.id, person_id: person.id})

      {:ok, comment} = CommentAdding.run(ctx.champion, check_in, "project_check_in", content)

      activity = get_activity(comment, action)
      notifications = fetch_notifications(activity.id, action: action)

      assert notifications_count(action: action) == 1
      assert hd(notifications).person_id == person.id
    end
  end

  describe "Commenting on goal update" do
    setup ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      space = group_fixture(champion)
      goal = goal_fixture(champion, %{
        space_id: space.id,
        reviewer_id: reviewer.id,
        champion_id: champion.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.comment_access(),
      })

      people = Enum.map(1..3, fn _ -> person_fixture_with_account(%{company_id: ctx.company.id}) end)
      attrs = Enum.map(people ++ [champion, reviewer], fn p -> %{id: p.id, permissions: Binding.edit_access()} end)
      {:ok, _} = Groups.add_members(ctx.creator, space.id, attrs)
      members = Groups.list_members(space)

      Map.merge(ctx, %{space: space, champion: champion, reviewer: reviewer, goal: goal, members: members})
    end

    test "Commenting on update notifies everyone", ctx do
      {:ok, update} = GoalCheckIn.run(ctx.champion, ctx.goal,%{
        goal_id: ctx.goal.id,
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :goal_update,
      })

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.champion, update, "goal_update", RichText.rich_text("Some comment"))
      end)
      action = "goal_check_in_commented"
      activity = get_activity(comment, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 4 == notifications_count(action: action) # 3 members + reviewer

      ctx.members
      |> Enum.filter(&(&1.id != ctx.champion.id))
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Commenting on update notifies selected people", ctx do
      {:ok, update} = GoalCheckIn.run(ctx.creator, ctx.goal,%{
        goal_id: ctx.goal.id,
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: false,
        subscriber_ids: [ctx.reviewer.id, ctx.champion.id],
        subscription_parent_type: :goal_update,
      })

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, update, "goal_update", RichText.rich_text("Some comment"))
      end)
      action = "goal_check_in_commented"
      activity = get_activity(comment, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 2 == notifications_count(action: action) # champion + reviewer

      [ctx.reviewer, ctx.champion]
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Mentioned person is notified", ctx do
      {:ok, update} = GoalCheckIn.run(ctx.creator, ctx.goal,%{
        goal_id: ctx.goal.id,
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: false,
        subscriber_ids: [],
        subscription_parent_type: :goal_update,
      })

      # Without permissions
      person = person_fixture_with_account(%{company_id: ctx.company.id})
      content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

      {:ok, comment} = CommentAdding.run(ctx.champion, update, "goal_update", content)

      action = "goal_check_in_commented"
      activity = get_activity(comment, action)

      assert notifications_count(action: action) == 0
      assert fetch_notifications(activity.id, action: action) == []

      # With permissions
      {:ok, _} = Groups.add_members(ctx.creator, ctx.space.id, [
        %{id: person.id, permissions: Binding.view_access()}
      ])

      {:ok, comment} = CommentAdding.run(ctx.champion, update, "goal_update", content)

      activity = get_activity(comment, action)
      notifications = fetch_notifications(activity.id, action: action)

      assert notifications_count(action: action) == 1
      assert hd(notifications).person_id == person.id
    end
  end

  describe "Commenting on message" do
    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:mike, :space)
      |> Factory.add_space_member(:bob, :space)
      |> Factory.add_space_member(:jane, :space)
    end

    test "Commenting on message notifies everyone", ctx do
      ctx = Factory.add_message(ctx, :message, :space, [
        person_ids: [ctx.creator.id],
        send_to_everyone: true,
      ])

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, ctx.message, "message", RichText.rich_text("Some comment"))
      end)

      action = "discussion_comment_submitted"
      activity = get_activity(comment, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 3 == notifications_count(action: action)

      [ctx.mike, ctx.bob, ctx.jane]
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Commenting on message notifies selected people", ctx do
      ctx = Factory.add_message(ctx, :message, :space, [
        person_ids: [ctx.mike.id, ctx.jane.id],
        send_to_everyone: false,
      ])

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, ctx.message, "message", RichText.rich_text("Some comment"))
      end)

      action = "discussion_comment_submitted"
      activity = get_activity(comment, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert 2 == notifications_count(action: action)

      [ctx.mike, ctx.jane]
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Mentioned person is notified", ctx do
      ctx = Factory.add_message(ctx, :message, :space, [
        person_ids: [ctx.creator.id],
        send_to_everyone: false,
      ])

      # Without permissions
      person = person_fixture_with_account(%{company_id: ctx.company.id})
      content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

      {:ok, comment} = CommentAdding.run(ctx.creator, ctx.message, "message", content)

      action = "discussion_comment_submitted"
      activity = get_activity(comment, action)

      assert notifications_count(action: action) == 0
      assert fetch_notifications(activity.id, action: action) == []

      # With permissions
      {:ok, _} = Groups.add_members(ctx.creator, ctx.space.id, [
        %{id: person.id, permissions: Binding.view_access()}
      ])

      {:ok, comment} = CommentAdding.run(ctx.creator, ctx.message, "message", content)

      activity = get_activity(comment, action)
      notifications = fetch_notifications(activity.id, action: action)

      assert notifications_count(action: action) == 1
      assert hd(notifications).person_id == person.id
    end
  end

  #
  # Helpers
  #

  defp get_activity(comment, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["comment_id"] == ^comment.id
    )
    |> Repo.one()
  end
end
