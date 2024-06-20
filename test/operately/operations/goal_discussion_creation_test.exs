defmodule Operately.Operations.GoalDiscussionCreationTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Notifications.Notification

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})
    reader = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(author)
    goal= goal_fixture(author, %{space_id: group.id, targets: []})

    {:ok, author: author, reader: reader, goal: goal}
  end

  test "GoalDiscussionCreation operation creates activity and thread", ctx do
    title = "some title"
    message = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"mention\",\"attrs\":{\"id\":\"#{ctx.reader.id}\",\"label\":\"#{ctx.reader.full_name}\"}}]}]}"

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

    assert 0 == Repo.aggregate(Notification, :count, :id)

    Oban.Testing.perform_job(Operately.Activities.NotificationDispatcher, %{activity_id: activity.id}, [])

    assert 1 == Repo.aggregate(Notification, :count, :id)

    assert nil != from(n in Notification, where: n.person_id == ^ctx.reader.id) |> Repo.one()
  end
end
