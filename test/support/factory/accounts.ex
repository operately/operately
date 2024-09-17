defmodule Operately.Support.Factory.Accounts do
  alias Operately.Support.Factory.Utils

  def add_account(ctx, testid) do
    account = Operately.PeopleFixtures.account_fixture(%{
      full_name: Utils.testid_to_name(testid),
    })
    Map.put(ctx, testid, account)
  end

end
