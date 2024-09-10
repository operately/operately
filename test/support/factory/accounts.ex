defmodule Operately.Support.Factory.Accounts do

  def add_account(ctx, testid) do
    account = Operately.PeopleFixtures.account_fixture()
    Map.put(ctx, testid, account)
  end

end
