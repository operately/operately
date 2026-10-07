defmodule OperatelyEE.AdminApi.Plugs.RequireSiteAdmin do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    account = conn.assigns[:current_account]

    cond do
      account && account.site_admin == true ->
        # The selected admin target is not the operator's company membership.
        language = Operately.I18n.AccountLanguage.resolve(account)
        Gettext.put_locale(OperatelyWeb.Gettext, Operately.I18n.Locale.to_gettext(language))
        assign(conn, :locale, language)

      true ->
        conn |> send_resp(401, "Unauthorized") |> halt()
    end
  end
end
