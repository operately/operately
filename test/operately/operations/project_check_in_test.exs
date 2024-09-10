defmodule Operately.Operations.ProjectCheckInTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding
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
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    })

    Enum.each(1..3, fn _ ->
      person = person_fixture_with_account(%{company_id: company.id})
      contributor_fixture(creator, %{
        project_id: project.id,
        person_id: person.id,
      })
    end)

    {:ok, %{company: company, creator: creator, champion: champion, reviewer: reviewer, project: project}}
  end

  test "Creating project check-in notifies only reviewer", ctx do
    {:ok, check_in} = Oban.Testing.with_testing_mode(:manual, fn ->
      ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        description: RichText.rich_text("Some description"),
        send_notifications_to_everyone: false,
        subscriber_ids: [ctx.reviewer.id, ctx.champion.id]
      })
    end)
    activity = get_activity(check_in)

    assert 0 == notifications_count(action: "project_check_in_submitted")

    perform_job(activity.id)

    assert 1 == notifications_count(action: "project_check_in_submitted")

    notifications = fetch_notifications(activity.id, action: "project_check_in_submitted")

    assert Enum.find(notifications, &(&1.person_id == ctx.reviewer.id))
  end

  test "Creating project check-in notifies all contributors", ctx do
    contributors = Operately.Projects.list_project_contributors(ctx.project)

    {:ok, check_in} = Oban.Testing.with_testing_mode(:manual, fn ->
      ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        description: RichText.rich_text("Some description"),
        send_notifications_to_everyone: false,
        subscriber_ids: Enum.map(contributors, &(&1.person_id))
      })
    end)
    activity = get_activity(check_in)

    assert 0 == notifications_count(action: "project_check_in_submitted")

    perform_job(activity.id)

    assert 4 == notifications_count(action: "project_check_in_submitted")

    notifications = fetch_notifications(activity.id, action: "project_check_in_submitted")

    contributors
    |> Enum.filter(&(&1.person_id != ctx.champion.id))
    |> Enum.each(fn c ->
      assert Enum.find(notifications, &(&1.person_id == c.person_id))
    end)
  end

  test "Creating project check-in notifies all contributors if send_to_everyone is true", ctx do
    {:ok, check_in} = Oban.Testing.with_testing_mode(:manual, fn ->
      ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        description: RichText.rich_text("Some description"),
        send_notifications_to_everyone: true,
        subscriber_ids: []
      })
    end)
    activity = get_activity(check_in)

    assert 0 == notifications_count(action: "project_check_in_submitted")

    perform_job(activity.id)

    assert 4 == notifications_count(action: "project_check_in_submitted")

    notifications = fetch_notifications(activity.id, action: "project_check_in_submitted")

    Operately.Projects.list_project_contributors(ctx.project)
    |> Enum.filter(&(&1.person_id != ctx.champion.id))
    |> Enum.each(fn c ->
      assert Enum.find(notifications, &(&1.person_id == c.person_id))
    end)
  end

  test "Creating project check-in does not notify creator", ctx do
    {:ok, check_in} = Oban.Testing.with_testing_mode(:manual, fn ->
      ProjectCheckIn.run(ctx.champion, ctx.project, %{
        status: "on_track",
        description: RichText.rich_text("Some description"),
        send_notifications_to_everyone: false,
        subscriber_ids: [ctx.champion.id]
      })
    end)

    activity = get_activity(check_in)
    perform_job(activity.id)

    assert 0 == notifications_count(action: "project_check_in_submitted")
  end

  test "Creating project check-in notifies mentioned person", ctx do
    person = person_fixture_with_account(%{company_id: ctx.company.id})
    content = RichText.rich_text(mentioned_people: [person]) |> Jason.decode!()
    action = "project_check_in_submitted"

    # Without permissions
    {:ok, check_in} = ProjectCheckIn.run(ctx.champion, ctx.project, %{
      status: "on_track",
      description: content,
      send_notifications_to_everyone: false,
      subscriber_ids: []
    })
    activity = get_activity(check_in)

    assert notifications_count(action: action) == 0
    assert fetch_notifications(activity.id, action: action) == []

    # With permissions
    contributor_fixture(ctx.creator, %{project_id: ctx.project.id, person_id: person.id})

    {:ok, check_in} = ProjectCheckIn.run(ctx.champion, ctx.project, %{
      status: "on_track",
      description: content,
      send_notifications_to_everyone: false,
      subscriber_ids: []
    })
    activity = get_activity(check_in)
    notifications = fetch_notifications(activity.id, action: action)

    assert notifications_count(action: action) == 1
    assert hd(notifications).person_id == person.id
  end

  #
  # Helpers
  #

  defp get_activity(check_in) do
    from(a in Operately.Activities.Activity,
      where: a.action == "project_check_in_submitted" and a.content["check_in_id"] == ^check_in.id
    )
    |> Repo.one()
  end
end
