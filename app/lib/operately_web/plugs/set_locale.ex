defmodule OperatelyWeb.Plugs.SetLocale do
  def init(opts), do: opts

  def call(conn, _opts) do
    language =
      Operately.I18n.EffectiveLanguage.put_request_locale(
        conn.assigns[:current_person],
        conn.assigns[:current_company]
      )

    Plug.Conn.assign(conn, :locale, language)
  end
end
