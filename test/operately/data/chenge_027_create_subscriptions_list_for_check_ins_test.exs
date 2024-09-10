defmodule Operately.Data.Chenge027CreateSubscriptionsListForCheckInsTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.{Projects, Notifications}

  setup ctx do
    company = company_fixture(%{})
    creator = person_fixture_with_account(%{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: company.company_space_id})

    Enum.each(1..3, fn _ ->
      person = person_fixture_with_account(%{company_id: company.id})
      contributor_fixture(creator, %{
        project_id: project.id,
        person_id: person.id
      })
    end)

    Map.merge(ctx, %{creator: creator, project: project})
  end

  test "creates subscriptions list for existing check-ins", ctx do
    check_ins = Enum.map(1..3, fn _ ->
      check_in_fixture(%{author_id: ctx.creator.id, project_id: ctx.project.id})
    end)

    contribs = Projects.list_project_contributors(ctx.project)

    Enum.each(check_ins, fn check_in ->
      Enum.each(contribs, fn contrib ->
        refute Notifications.get_subscription(subscription_list_id: check_in.subscription_list_id, person_id: contrib.person_id)
      end)
    end)

    Operately.Data.Chenge027CreateSubscriptionsListForCheckIns.run()

    Enum.each(check_ins, fn check_in ->
      Enum.each(contribs, fn contrib ->
        assert Notifications.get_subscription(subscription_list_id: check_in.subscription_list_id, person_id: contrib.person_id)
      end)
    end)
  end
end
