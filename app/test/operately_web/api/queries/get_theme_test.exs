defmodule OperatelyWeb.Api.Queries.GetThemeTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_theme, %{})
    end
  end

  describe "get_theme functionality" do
    setup :register_and_log_in_account

    test "it returns the current account's theme", ctx do
      assert {200, %{theme: "system"}} = query(ctx.conn, :get_theme, %{})
    end

    test "it returns the updated theme", ctx do
      account = Operately.People.get_account!(ctx.person.account_id)
      {:ok, _} = Operately.People.update_theme(account, :dark)
      
      assert {200, %{theme: "dark"}} = query(ctx.conn, :get_theme, %{})
    end
  end
end
