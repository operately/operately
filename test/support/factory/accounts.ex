defmodule Operately.Support.Factory.Accounts do
  alias Operately.Support.Factory.Utils

  def add_account(ctx, testid) do
    account = Operately.PeopleFixtures.account_fixture(%{
      full_name: Utils.testid_to_name(testid),
    })
    Map.put(ctx, testid, account)
  end

  def log_in_person(ctx, person_name) do
    person = Map.fetch!(ctx, person_name)

    login(ctx, person)
  end

  def log_in_contributor(ctx, contributor_name) do
    contributor = Map.fetch!(ctx, contributor_name)
    person = Operately.People.get_person(contributor.person_id)

    login(ctx, person)
  end

  defp login(ctx, person) do
    if ctx.feature == true do
      Operately.Support.Features.UI.login_as(ctx, person)
    else
      OperatelyWeb.TurboCase.log_in_account(ctx, person)
    end
  end
end
