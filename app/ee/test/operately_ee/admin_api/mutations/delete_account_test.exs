defmodule OperatelyEE.AdminApi.Mutations.DeleteAccountTest do
  use OperatelyWeb.TurboCase

  alias Operately.People
  alias Operately.People.Account

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :delete_account, %{account_id: Ecto.UUID.generate()})
    end

    test "it requires a site admin", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.log_in_account(ctx, :account)

      assert {401, "Unauthorized"} = admin_mutation(ctx.conn, :delete_account, %{account_id: ctx.account.id})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_account(:target_account)

      {:ok, _} = Account.promote_to_admin(ctx.account)

      ctx
      |> Map.put(:account, Repo.get!(Account, ctx.account.id))
      |> Factory.log_in_account(:account)
    end

    test "deletes a normal account", ctx do
      assert {200, %{success: true}} = admin_mutation(ctx.conn, :delete_account, %{account_id: ctx.target_account.id})
      assert People.get_account_by_email(ctx.target_account.email) == nil
    end

    test "returns a useful error when the target is the last owner of a company", ctx do
      ctx = Factory.add_company(ctx, :target_company, ctx.target_account)

      assert {200, %{success: false, error: error, blocking_company_names: [company_name]}} =
               admin_mutation(ctx.conn, :delete_account, %{account_id: ctx.target_account.id})

      assert company_name == ctx.target_company.name
      assert error =~ "Transfer ownership or delete the company first"
    end

    test "returns a useful error when the target is the last site admin", ctx do
      ctx =
        ctx
        |> Factory.reload(:account)
        |> Factory.add_company_owner(:other_owner)

      assert {200, %{success: false, error: error}} =
               admin_mutation(ctx.conn, :delete_account, %{account_id: ctx.account.id})

      assert error =~ "last site admin"
    end
  end
end
