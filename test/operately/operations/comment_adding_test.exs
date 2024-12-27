defmodule Operately.Operations.CommentAddingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures

  alias Operately.{Groups, Projects}
  alias Operately.Support.{Factory, RichText}
  alias Operately.Access.Binding
  alias Operately.Operations.{GoalCheckIn, ProjectCheckIn, CommentAdding, ProjectClosed, ResourceHubDocumentCreating}

  setup ctx do
    ctx
    |> Factory.setup()
  end

  describe "Commenting on check-in" do
    setup ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      space = group_fixture(champion)
      project = project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        creator_is_contributor: "no",
        champion_id: champion.id,
        reviewer_id: reviewer.id,
        group_id: space.id,
        company_access_level: Binding.no_access(),
        space_access_level: Binding.view_access(),
      })

      Enum.each(1..3, fn _ ->
        person = person_fixture_with_account(%{company_id: ctx.company.id})
        contributor_fixture(ctx.creator, %{project_id: project.id, person_id: person.id})
      end)
      contribs = Operately.Projects.list_project_contributors(project)

      Map.merge(ctx, %{
        champion: champion,
        reviewer: reviewer,
        space: space,
        project: project,
        contribs: contribs,
      })
    end

    test "Commenting on check-in notifies everyone", ctx do
      {:ok, check_in} = ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        content: RichText.rich_text("Some description"),
        send_to_everyone: true,
        subscriber_ids: Enum.map(ctx.contribs, &(&1.person_id)),
        subscription_parent_type: :project_check_in
      })
      check_in = Repo.preload(check_in, :project)

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
      check_in = Repo.preload(check_in, :project)

      # Without permissions
      person = person_fixture_with_account(%{company_id: ctx.company.id})
      content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

      {:ok, comment} = CommentAdding.run(ctx.champion, check_in, "project_check_in", content)

      action = "project_check_in_commented"
      activity = get_activity(comment, action)

      assert notifications_count(action: action) == 0
      assert fetch_notifications(activity.id, action: action) == []

      # With permissions
      {:ok, _} = Groups.add_members(ctx.champion, ctx.space.id, [
        %{id: person.id, access_level: Binding.view_access()}
      ])

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
      attrs = Enum.map(people ++ [champion, reviewer], fn p -> %{id: p.id, access_level: Binding.edit_access()} end)
      {:ok, _} = Groups.add_members(ctx.creator, space.id, attrs)
      members = Groups.list_members(space)

      Map.merge(ctx, %{space: space, champion: champion, reviewer: reviewer, goal: goal, members: members})
    end

    test "Commenting on update notifies everyone", ctx do
      {:ok, update} = GoalCheckIn.run(ctx.champion, ctx.goal,%{
        status: "on_track",
        goal_id: ctx.goal.id,
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :goal_update,
      })
      update = Repo.preload(update, :goal)

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
        status: "on_track",
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: false,
        subscriber_ids: [ctx.reviewer.id, ctx.champion.id],
        subscription_parent_type: :goal_update,
      })
      update = Repo.preload(update, :goal)

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
      {:ok, update} = GoalCheckIn.run(ctx.champion, ctx.goal,%{
        goal_id: ctx.goal.id,
        status: "on_track",
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: false,
        subscriber_ids: [],
        subscription_parent_type: :goal_update,
      })
      update = Repo.preload(update, :goal)

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
        %{id: person.id, access_level: Binding.view_access()}
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
      |> Factory.add_messages_board(:messages_board, :space)
    end

    test "Commenting on message notifies everyone", ctx do
      ctx =
        ctx
        |> Factory.add_message(:message, :messages_board, send_to_everyone: true)
        |> Factory.preload(:message, :space)

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
      ctx =
        ctx
        |> Factory.add_message(:message, :messages_board, [
          person_ids: [ctx.mike.id, ctx.jane.id],
          send_to_everyone: false,
        ])
        |> Factory.preload(:message, :space)

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
      ctx =
        ctx
        |> Factory.add_message(:message, :messages_board, send_to_everyone: false)
        |> Factory.preload(:message, :space)

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
        %{id: person.id, access_level: Binding.view_access()}
      ])

      {:ok, comment} = CommentAdding.run(ctx.creator, ctx.message, "message", content)

      activity = get_activity(comment, action)
      notifications = fetch_notifications(activity.id, action: action)

      assert notifications_count(action: action) == 1
      assert hd(notifications).person_id == person.id
    end
  end

  describe "Commenting on project retrospective" do
    @retrospective_content %{
      "whatWentWell" => RichText.rich_text("some content"),
      "whatDidYouLearn" => RichText.rich_text("some content"),
      "whatCouldHaveGoneBetter" => RichText.rich_text("some content"),
    }

    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:reviewer, :space)
      |> Factory.add_project(:project, :space, reviewer: :reviewer)
      |> Factory.add_project_contributor(:contrib1, :project, :as_person)
      |> Factory.add_project_contributor(:contrib2, :project, :as_person)
      |> Factory.add_project_contributor(:contrib3, :project, :as_person)
      |> Factory.preload(:project, :group)
    end

    test "Commenting on retrospective notifies everyone", ctx do
      {:ok, retrospective} = ProjectClosed.run(ctx.creator, ctx.project, %{
        retrospective: @retrospective_content,
        content: %{},
        send_to_everyone: true,
        subscription_parent_type: :project_retrospective,
        subscriber_ids: []
      })
      retrospective = Repo.preload(retrospective, :project)

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, retrospective, "project_retrospective", RichText.rich_text("Some comment"))
      end)

      action = "project_retrospective_commented"
      activity = get_activity(comment, action)

      assert notifications_count(action: action) == 0

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert notifications_count(action: action) == 4

      Projects.list_project_contributors(ctx.project)
      |> Enum.filter(&(&1.person_id != ctx.creator.id))
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.person_id))
      end)
    end

    test "Commenting on retrospective notifies selected people", ctx do
      {:ok, retrospective} = ProjectClosed.run(ctx.creator, ctx.project, %{
        retrospective: @retrospective_content,
        content: %{},
        send_to_everyone: false,
        subscription_parent_type: :project_retrospective,
        subscriber_ids: [ctx.reviewer.id, ctx.contrib1.id]
      })
      retrospective = Repo.preload(retrospective, :project)

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, retrospective, "project_retrospective", RichText.rich_text("Some comment"))
      end)

      action = "project_retrospective_commented"
      activity = get_activity(comment, action)

      assert notifications_count(action: action) == 0

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)

      assert notifications_count(action: action) == 2

      [ctx.reviewer, ctx.contrib1]
      |> Enum.each(fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Mentioned person is notified", ctx do
      ctx =
        ctx
        |> Factory.edit_project_company_members_access(:project, :no_access)
        |> Factory.add_project_retrospective(:retrospective, :project, :creator)
        |> Factory.preload(:retrospective, :project)

      # Without permissions
      person = person_fixture_with_account(%{company_id: ctx.company.id})
      content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

      {:ok, comment} = CommentAdding.run(ctx.creator, ctx.retrospective, "project_retrospective", content)

      action = "project_retrospective_commented"
      activity = get_activity(comment, action)

      assert notifications_count(action: action) == 0
      assert fetch_notifications(activity.id, action: action) == []

      # With permissions
      {:ok, _} = Groups.add_members(ctx.creator, ctx.space.id, [
        %{id: person.id, access_level: Binding.view_access()}
      ])

      {:ok, comment} = CommentAdding.run(ctx.creator, ctx.retrospective, "project_retrospective", content)

      activity = get_activity(comment, action)
      notifications = fetch_notifications(activity.id, action: action)

      assert notifications_count(action: action) == 1
      assert hd(notifications).person_id == person.id
    end
  end

  describe "Commenting on resource hub document" do
    @action "resource_hub_document_commented"

    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:mike, :space)
      |> Factory.add_space_member(:bob, :space)
      |> Factory.add_space_member(:jane, :space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
    end

    test "Commenting on document notifies everyone", ctx do
      {:ok, document} = ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
        name: "A document",
        content: RichText.rich_text("Some content"),
        send_to_everyone: true,
        subscription_parent_type: :resource_hub_document,
        subscriber_ids: [],
      })
      document = Repo.preload(document, :resource_hub)

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, document, "resource_hub_document", RichText.rich_text("Some comment"))
      end)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 0

      perform_job(activity.id)

      assert notifications_count(action: @action) == 3

      notifications = fetch_notifications(activity.id, action: @action)

      Enum.each([ctx.mike, ctx.bob, ctx.jane], fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Commenting on document notifies selected people", ctx do
      {:ok, document} = ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
        name: "A document",
        content: RichText.rich_text("Some content"),
        send_to_everyone: false,
        subscription_parent_type: :resource_hub_document,
        subscriber_ids: [ctx.mike.id],
      })
      document = Repo.preload(document, :resource_hub)

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, document, "resource_hub_document", RichText.rich_text("Some comment"))
      end)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 0

      perform_job(activity.id)

      assert notifications_count(action: @action) == 1

      notification = fetch_notification(activity.id)
      assert notification.person_id == ctx.mike.id
    end

    test "Mentioned person is notified", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space)
        |> Factory.add_resource_hub(:hub, :space, :creator, company_access_level: Binding.no_access())

      {:ok, document} = ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
        name: "A document",
        content: RichText.rich_text("Some content"),
        send_to_everyone: true,
        subscription_parent_type: :resource_hub_document,
        subscriber_ids: [],
      })
      document = Repo.preload(document, :resource_hub)

      # Without permissions
      person = person_fixture_with_account(%{company_id: ctx.company.id})
      content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

      {:ok, comment} = CommentAdding.run(ctx.creator, document, "resource_hub_document", content)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 0
      assert fetch_notifications(activity.id, action: @action) == []

      # With permissions
      {:ok, _} = Groups.add_members(ctx.creator, ctx.space.id, [
        %{id: person.id, access_level: Binding.view_access()}
      ])

      {:ok, comment} = CommentAdding.run(ctx.creator, document, "resource_hub_document", content)

      activity = get_activity(comment, @action)
      notifications = fetch_notifications(activity.id, action: @action)

      assert notifications_count(action: @action) == 1
      assert hd(notifications).person_id == person.id
    end
  end

  describe "Commenting on resource hub file" do
    @action "resource_hub_file_commented"

    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:mike, :space)
      |> Factory.add_space_member(:bob, :space)
      |> Factory.add_space_member(:jane, :space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
    end

    test "Commenting on file notifies everyone", ctx do
      file = create_file(ctx, true, [])

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, file, "resource_hub_file", RichText.rich_text("Some comment"))
      end)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 0

      perform_job(activity.id)

      assert notifications_count(action: @action) == 3

      notifications = fetch_notifications(activity.id, action: @action)

      Enum.each([ctx.mike, ctx.bob, ctx.jane], fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Commenting on file notifies selected people", ctx do
      file = create_file(ctx, false, [ctx.mike.id])

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, file, "resource_hub_file", RichText.rich_text("Some comment"))
      end)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 0

      perform_job(activity.id)

      assert notifications_count(action: @action) == 1

      notification = fetch_notification(activity.id)
      assert notification.person_id == ctx.mike.id
    end

    test "Mentioned person is notified", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space)
        |> Factory.add_resource_hub(:hub, :space, :creator, company_access_level: Binding.no_access())
        |> Factory.add_company_member(:person)

      file = create_file(ctx, true, [])
      content = RichText.rich_text(mentioned_people: [ctx.person]) |> Jason.decode!()

      # Without permissions
      {:ok, comment} = CommentAdding.run(ctx.creator, file, "resource_hub_file", content)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 0
      assert fetch_notifications(activity.id, action: @action) == []

      # With permissions
      {:ok, _} = Groups.add_members(ctx.creator, ctx.space.id, [
        %{id: ctx.person.id, access_level: Binding.view_access()}
      ])

      {:ok, comment} = CommentAdding.run(ctx.creator, file, "resource_hub_file", content)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 1
      assert fetch_notification(activity.id).person_id == ctx.person.id
    end
  end

  describe "Commenting on resource hub link" do
    @action "resource_hub_link_commented"

    setup ctx do
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:mike, :space)
      |> Factory.add_space_member(:bob, :space)
      |> Factory.add_space_member(:jane, :space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
    end

    test "Commenting on link notifies everyone", ctx do
      link = create_link(ctx, true, [])

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, link, "resource_hub_link", RichText.rich_text("Some comment"))
      end)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 0

      perform_job(activity.id)

      assert notifications_count(action: @action) == 3

      notifications = fetch_notifications(activity.id, action: @action)

      Enum.each([ctx.mike, ctx.bob, ctx.jane], fn p ->
        assert Enum.find(notifications, &(&1.person_id == p.id))
      end)
    end

    test "Commenting on link notifies selected people", ctx do
      link = create_link(ctx, false, [ctx.mike.id])

      {:ok, comment} = Oban.Testing.with_testing_mode(:manual, fn ->
        CommentAdding.run(ctx.creator, link, "resource_hub_link", RichText.rich_text("Some comment"))
      end)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 0

      perform_job(activity.id)

      assert notifications_count(action: @action) == 1

      notification = fetch_notification(activity.id)
      assert notification.person_id == ctx.mike.id
    end

    test "Mentioned person is notified", ctx do
      ctx =
        ctx
        |> Factory.add_space(:space)
        |> Factory.add_resource_hub(:hub, :space, :creator, company_access_level: Binding.no_access())
        |> Factory.add_company_member(:person)

      link = create_link(ctx, true, [])
      content = RichText.rich_text(mentioned_people: [ctx.person]) |> Jason.decode!()

      # Without permissions
      {:ok, comment} = CommentAdding.run(ctx.creator, link, "resource_hub_link", content)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 0
      assert fetch_notifications(activity.id, action: @action) == []

      # With permissions
      {:ok, _} = Groups.add_members(ctx.creator, ctx.space.id, [
        %{id: ctx.person.id, access_level: Binding.view_access()}
      ])

      {:ok, comment} = CommentAdding.run(ctx.creator, link, "resource_hub_link", content)

      activity = get_activity(comment, @action)

      assert notifications_count(action: @action) == 1
      assert fetch_notification(activity.id).person_id == ctx.person.id
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

  defp create_file(ctx, send_to_everyone, people_list, content \\ nil) do
    blob = Operately.BlobsFixtures.blob_fixture(%{author_id: ctx.creator.id, company_id: ctx.company.id})

    {:ok, file} = Operately.Operations.ResourceHubFileCreating.run(ctx.creator, ctx.hub, %{
      name: "Some name",
      content: content || RichText.rich_text("Content"),
      send_to_everyone: send_to_everyone,
      subscription_parent_type: :resource_hub_file,
      subscriber_ids: people_list,
      blob_id: blob.id,
    })
    Repo.preload(file, :resource_hub)
  end

  defp create_link(ctx, send_to_everyone, people_list, content \\ nil) do
    {:ok, link} = Operately.Operations.ResourceHubLinkCreating.run(ctx.creator, ctx.hub, %{
      name: "My link",
      url: "http://localhost:4000",
      type: :other,
      content: content || RichText.rich_text("Content"),
      subscription_parent_type: :resource_hub_link,
      send_to_everyone: send_to_everyone,
      subscriber_ids: people_list,
    })
    Repo.preload(link, :resource_hub)
  end
end
