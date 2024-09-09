defmodule Operately.Operations.ProjectCheckInTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Support.RichText
  alias Operately.Operations.ProjectCheckIn

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})

    project = project_fixture(%{
      company_id: company.id,
      creator_id: creator.id,
      creator_is_contributor: "no",
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      group_id: company.company_space_id,
    })

    Enum.each(1..3, fn _ ->
      person = person_fixture_with_account(%{company_id: company.id})
      contributor_fixture(creator, %{
        project_id: project.id,
        person_id: person.id,
      })
    end)

    {:ok, %{creator: creator, champion: champion, reviewer: reviewer, project: project}}
  end

  test "Creating project check-in notifies only reviewer and champion", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, _} = ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        description: RichText.rich_text("Some description"),
        send_notifications_to_everyone: false,
        subscriber_ids: [ctx.reviewer.id, ctx.champion.id]
      })
    end)
    activity = get_activity(ctx.project)

    assert 0 == notifications_count(action: "project_check_in_submitted")

    perform_job(activity.id)

    assert 2 == notifications_count(action: "project_check_in_submitted")

    notifications = fetch_notifications(activity.id, action: "project_check_in_submitted")

    assert Enum.find(notifications, &(&1.person_id == ctx.reviewer.id))
    assert Enum.find(notifications, &(&1.person_id == ctx.champion.id))
  end

  test "Creating project check-in notifies all contributors", ctx do
    contributors = Operately.Projects.list_project_contributors(ctx.project)

    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, _} = ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        description: RichText.rich_text("Some description"),
        send_notifications_to_everyone: false,
        subscriber_ids: Enum.map(contributors, &(&1.person_id))
      })
    end)
    activity = get_activity(ctx.project)

    assert 0 == notifications_count(action: "project_check_in_submitted")

    perform_job(activity.id)

    assert 5 == notifications_count(action: "project_check_in_submitted")

    notifications = fetch_notifications(activity.id, action: "project_check_in_submitted")

    Enum.each(contributors, fn c ->
      assert Enum.find(notifications, &(&1.person_id == c.person_id))
    end)
  end

  test "Creating project check-in notifies all contributors if send_to_everyone is true", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, _} = ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        description: RichText.rich_text("Some description"),
        send_notifications_to_everyone: true,
        subscriber_ids: []
      })
    end)
    activity = get_activity(ctx.project)

    assert 0 == notifications_count(action: "project_check_in_submitted")

    perform_job(activity.id)

    assert 5 == notifications_count(action: "project_check_in_submitted")

    notifications = fetch_notifications(activity.id, action: "project_check_in_submitted")
    contributors = Operately.Projects.list_project_contributors(ctx.project)

    Enum.each(contributors, fn c ->
      assert Enum.find(notifications, &(&1.person_id == c.person_id))
    end)
  end

  #
  # Helpers
  #

  defp get_activity(project) do
    from(a in Operately.Activities.Activity,
      where: a.action == "project_check_in_submitted" and a.content["project_id"] == ^project.id
    )
    |> Repo.one()
  end
end
