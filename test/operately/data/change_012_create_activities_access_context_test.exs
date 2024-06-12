defmodule Operately.Data.Change012CreateActivitiesAccessContextTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.AccessFixtures
  import Operately.ActivitiesFixtures
  import Operately.PeopleFixtures

  alias Operately.Data.Change012CreateActivitiesAccessContext

  setup do
    company = company_fixture()
    context_fixture(%{company_id: company.id})
    author = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, author: author}
  end

  describe "creates access_context for existing activities" do
    test "company_member_removed activity", ctx do
      attrs = %{
        action: "company_member_removed",
        author_id: ctx.author.id,
        content: %{
          company_id: ctx.company.id,
          name: "",
          email: "",
          title: "",
        }
      }

      activities = Enum.map(1..3, fn _ ->
        activity_fixture(attrs)
      end)

      Enum.each(activities, fn activity ->
        assert activity.context_id == nil
      end)

      Change012CreateActivitiesAccessContext.run()

      company = Repo.preload(ctx.company, :access_context)

      Enum.each(activities, fn activity ->
        activity = Repo.reload(activity)
        assert activity.context_id == company.access_context.id
      end)
    end
  end
end
