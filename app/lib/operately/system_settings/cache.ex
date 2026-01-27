defmodule Operately.SystemSettings.Cache do
  @moduledoc false

  alias Operately.SystemSettings

  @cache_key {__MODULE__, :settings}

  def get do
    case :persistent_term.get(@cache_key, :missing) do
      :missing -> load()
      settings -> settings
    end
  end

  def refresh do
    load()
  end

  def clear do
    :persistent_term.erase(@cache_key)
    :ok
  end

  defp load do
    settings = SystemSettings.get()
    :persistent_term.put(@cache_key, settings)
    settings
  end
end
