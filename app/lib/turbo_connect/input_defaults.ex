defmodule TurboConnect.InputDefaults do
  alias TurboConnect.Api

  def effective_default(opts, api_module) when is_list(opts) do
    cond do
      Api.default_source(api_module) == :external and Keyword.has_key?(opts, :external_default) ->
        {:ok, Keyword.get(opts, :external_default)}

      Keyword.has_key?(opts, :default) ->
        {:ok, Keyword.get(opts, :default)}

      true ->
        :error
    end
  end

  def effective_default(_opts, _api_module), do: :error

  def normalize_fields_for_api(fields, api_module) do
    Enum.map(fields, &normalize_field_for_api(&1, api_module))
  end

  def normalize_field_for_api({name, type, opts}, api_module) do
    {name, type, normalize_opts_for_api(opts, api_module)}
  end

  def normalize_opts_for_api(opts, api_module) when is_list(opts) do
    normalized_opts = Keyword.delete(opts, :external_default)

    case effective_default(opts, api_module) do
      {:ok, default} -> Keyword.put(normalized_opts, :default, default)
      :error -> Keyword.delete(normalized_opts, :default)
    end
  end

  def normalize_opts_for_api(opts, _api_module), do: opts
end
