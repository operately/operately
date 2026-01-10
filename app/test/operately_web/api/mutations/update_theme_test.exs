defmodule OperatelyWeb.Api.Mutations.UpdateThemeTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :update_theme, %{theme: "dark"})
    end
  end

  describe "updating theme" do
    setup :register_and_log_in_account

    test "it updates the theme", ctx do
      assert {200, %{success: true}} = mutation(ctx.conn, :update_theme, %{theme: "dark"})

      account = Operately.People.get_account!(ctx.person.account_id)
      assert account.theme == "dark"

      assert {200, %{success: true}} = mutation(ctx.conn, :update_theme, %{theme: "light"})

      account = Operately.People.get_account!(ctx.person.account_id)
      assert account.theme == "light"
    end
  end
end
