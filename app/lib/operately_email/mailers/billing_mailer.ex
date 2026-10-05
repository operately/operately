defmodule OperatelyEmail.Mailers.BillingMailer do
  @moduledoc false

  alias Operately.I18n.{EffectiveLanguage, Locale}
  alias OperatelyEmail.Mailers.BaseMailer

  def deliver(recipients, company, build) do
    recipients
    |> Enum.group_by(&EffectiveLanguage.resolve(&1, company))
    |> Enum.sort_by(fn {language, _} -> language end)
    |> Enum.reduce_while({:ok, :no_recipients}, fn {language, people}, _result ->
      result =
        Gettext.with_locale(OperatelyWeb.Gettext, Locale.to_gettext(language), fn ->
          people |> build.() |> BaseMailer.deliver_now()
        end)

      case result do
        {:ok, _} -> {:cont, result}
        {:error, _} -> {:halt, result}
      end
    end)
  end
end
