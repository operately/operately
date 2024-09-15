defmodule Operately.Operations.CommentAddingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Support.RichText
  alias Operately.Access.Binding
  alias Operately.Operations.ProjectCheckIn
  alias Operately.Operations.CommentAdding

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})

    {:ok, %{company: company, creator: creator}}
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
