defmodule Operately.Data.Change011CreateActivitiesAccessContextTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ActivitiesFixtures

  alias Operately.Repo
  alias Operately.Access.Context
  alias Operately.Data.Change011CreateActivitiesAccessContext

  setup do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})

    {:ok, author: author}
  end

  test "creates access_context for existing activities", ctx do
    activities = Enum.map(1..5, fn _ ->
      activity_fixture(%{author_id: ctx.author.id})
    end)

    Enum.each(activities, fn activity ->
      assert nil == Repo.get_by(Context, activity_id: activity.id)
    end)

    Change011CreateActivitiesAccessContext.run()

    Enum.each(activities, fn activity ->
      assert %Context{} = Repo.get_by(Context, activity_id: activity.id)
    end)
  end
end
