defmodule OperatelyEE.AdminApi.Queries.GetAccountsTest do
  use OperatelyWeb.TurboCase

  alias Operately.Operations.AccountDeleting
  alias Operately.People
  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_accounts, %{})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_query(ctx.conn, :get_accounts, %{})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.add_company(ctx, :second_company, ctx.account)
      ctx = Factory.add_account(ctx, :deleted_account)

      {:ok, _} = Account.promote_to_admin(ctx.account)
      {:ok, _} = AccountDeleting.run(ctx.deleted_account)

      account = Repo.get!(Account, ctx.account.id)
      conn = OperatelyWeb.TurboCase.log_in_account(ctx.conn, account, ctx.company)

      ctx
      |> Map.put(:account, account)
      |> Map.put(:conn, conn)
    end

    test "returns non-deleted accounts with active company counts", ctx do
      assert {200, %{accounts: accounts}} = admin_query(ctx.conn, :get_accounts, %{})

      refute Enum.any?(accounts, &(&1.id == ctx.deleted_account.id))

      account = Enum.find(accounts, &(&1.id == ctx.account.id))

      assert account.full_name == ctx.account.full_name
      assert account.email == ctx.account.email
      assert account.site_admin == true
      assert account.companies_count == 2
      assert account.owned_companies_count == 2
      assert account.inserted_at
    end

    test "counts only active memberships", ctx do
      second_person = People.get_person!(People.get_person(ctx.account, ctx.second_company).id)
      {:ok, _} = People.update_person(second_person, %{suspended: true, suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)})

      assert {200, %{accounts: accounts}} = admin_query(ctx.conn, :get_accounts, %{})

      account = Enum.find(accounts, &(&1.id == ctx.account.id))
      assert account.companies_count == 1
      assert account.owned_companies_count == 1
    end
  end
end
