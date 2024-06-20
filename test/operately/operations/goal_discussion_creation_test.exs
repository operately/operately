defmodule Operately.Operations.GoalDiscussionCreationTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})
    reader = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(author)
    goal= goal_fixture(author, %{space_id: group.id, targets: []})

    {:ok, author: author, reader: reader, goal: goal}
  end

  test "GoalDiscussionCreation operation creates activity, thread and notification", ctx do
    title = "some title"
    message = notification_message(ctx.reader)

    Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.GoalDiscussionCreation.run(ctx.author, ctx.goal, title, message)
    end)

    activity = from(a in Activity,
      where: a.action == "goal_discussion_creation" and a.content["goal_id"] == ^ctx.goal.id,
      preload: :comment_thread
    )
    |> Repo.one()

    assert activity.comment_thread_id != nil
    assert activity.comment_thread.title == title

    assert 0 == notifications_count()

    perform_job(activity.id)

    assert 1 == notifications_count()

    assert nil != fetch_notification(activity.id)
  end
end
