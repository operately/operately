defmodule Operately.Operations.CommentAddingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Support.RichText
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
      })

      Enum.each(1..3, fn _ ->
        person = person_fixture_with_account(%{company_id: ctx.company.id})
        contributor_fixture(ctx.creator, %{
          project_id: project.id,
          person_id: person.id,
        })
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
        description: RichText.rich_text("Some description"),
        send_notifications_to_everyone: false,
        subscriber_ids: Enum.map(ctx.contribs, &(&1.person_id)),
      })

      Oban.Testing.with_testing_mode(:manual, fn ->
        {:ok, _} = CommentAdding.run(ctx.champion, check_in, "project_check_in", RichText.rich_text("Some comment"))
      end)
      action = "project_check_in_commented"
      activity = get_activity(ctx.project, action)

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
        description: RichText.rich_text("Some description"),
        send_notifications_to_everyone: false,
        subscriber_ids: [ctx.champion.id],
      })

      person = person_fixture_with_account(%{company_id: ctx.company.id})

      Oban.Testing.with_testing_mode(:manual, fn ->
        content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()

        {:ok, _} = CommentAdding.run(ctx.champion, check_in, "project_check_in", content)
      end)
      action = "project_check_in_commented"
      activity = get_activity(ctx.project, action)

      assert 0 == notifications_count(action: action)

      perform_job(activity.id)
      assert 1 == notifications_count(action: action)

      notifications = fetch_notifications(activity.id, action: action)
      assert hd(notifications).person_id == person.id
    end
  end

  #
  # Helpers
  #

  defp get_activity(project, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["project_id"] == ^project.id
    )
    |> Repo.one()
  end
end
