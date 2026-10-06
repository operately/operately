defmodule OperatelyEE.AdminApi.Plugs.RequireSiteAdminTest do
  use OperatelyWeb.TurboCase

  alias OperatelyEE.AdminApi.Plugs.RequireSiteAdmin

  test "operator locale uses their account, not the administration target, and respects rollback", ctx do
    ctx = Factory.setup(ctx) |> Factory.enable_feature("i18n")
    {:ok, _} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    {:ok, account} = Operately.People.Account.promote_to_admin(ctx.account)
    target = Operately.CompaniesFixtures.company_fixture()
    previous = Gettext.get_locale(OperatelyWeb.Gettext)
    on_exit(fn -> Gettext.put_locale(OperatelyWeb.Gettext, previous) end)

    conn = ctx.conn |> Plug.Conn.assign(:current_account, account) |> Plug.Conn.assign(:current_company, target)
    assert RequireSiteAdmin.call(conn, []).assigns.locale == "pt-BR"
    assert Gettext.get_locale(OperatelyWeb.Gettext) == "pt_BR"

    Operately.Companies.disable_experimental_feature(ctx.company, "i18n")
    assert RequireSiteAdmin.call(conn, []).assigns.locale == "en"
    assert Gettext.get_locale(OperatelyWeb.Gettext) == "en"
  end
end
