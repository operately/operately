defmodule Operately.I18n.Languages do
  @moduledoc false

  @default "en"
  @supported ~w(en pt-BR)
  @feature_flag "i18n"

  def default, do: @default
  def supported, do: @supported
  def feature_flag, do: @feature_flag

  def supported?(language) when is_binary(language), do: language in @supported
  def supported?(_), do: false

  def api_values, do: Enum.map(@supported, &String.to_atom/1)
end
