defmodule Operately.Operations.GoalDiscussionCreationTest do
  use Operately.DataCase

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
    group = group_fixture(author)
    goal= goal_fixture(author, %{space_id: group.id, targets: []})

    {:ok, author: author, goal: goal}
  end

  test "GoalDiscussionCreation operation creates activity and thread", ctx do
    title = "some title"

    Operately.Operations.GoalDiscussionCreation.run(ctx.author, ctx.goal.id, title, "{}")

    activity = from(a in Activity,
      where: a.action == "goal_discussion_creation" and a.content["goal_id"] == ^ctx.goal.id,
      preload: :comment_thread
    )
    |> Repo.one()

    assert activity.comment_thread_id != nil
    assert activity.comment_thread.title == title
  end
end
