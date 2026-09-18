defmodule Operately.I18n.Placeholders do
  @moduledoc false

  @named_i18next ~r/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/
  @named_gettext ~r/%\{([A-Za-z_][A-Za-z0-9_]*)\}/

  def to_gettext(text) when is_binary(text) do
    Regex.replace(@named_i18next, text, "%{\\1}")
  end

  def to_i18next(text) when is_binary(text) do
    Regex.replace(@named_gettext, text, "{{\\1}}")
  end
end
