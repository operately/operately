defmodule OperatelyWeb.Plugs.SetLocale do
  alias Operately.I18n.{AccountLanguage, EffectiveLanguage, Locale}

  def init(opts), do: opts

  def call(conn, _opts) do
    language = resolve(conn)
    Gettext.put_locale(OperatelyWeb.Gettext, Locale.to_gettext(language))
    Plug.Conn.assign(conn, :locale, language)
  end

  defp resolve(%{assigns: %{current_person: person, current_company: company}}) when not is_nil(person) do
    EffectiveLanguage.resolve(person, company)
  end

  defp resolve(conn), do: AccountLanguage.resolve(conn.assigns[:current_account])
end
