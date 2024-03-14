defmodule OperatelyWeb.Graphql.Middlewares.ExceptionHandler do
  require Logger

  alias Absinthe.Resolution

  def wrap_all_middlewares(middlewares) do
    middlewares |> Enum.map(&handle_exceptions/1)
  end

  def handle_exceptions(middleware_spec) do
    fn resolution, config ->
      middleware_spec
      |> wrap_middleware(resolution, config)
      |> execute(resolution)
    end
  end

  defp wrap_middleware({{mod, fun}, config}, resolution, _config) do
    fn -> apply(mod, fun, [resolution, config]) end
  end

  defp wrap_middleware({mod, config}, resolution, _config) do
    fn -> apply(mod, :call, [resolution, config]) end
  end

  defp wrap_middleware(mod, resolution, config) when is_atom(mod) do
    fn -> apply(mod, :call, [resolution, config]) end
  end

  defp wrap_middleware(fun, resolution, config) when is_function(fun, 2) do
    fn -> fun.(resolution, config) end
  end

  defp execute(fun, res) do
    fun.()
  rescue
    e ->
      Logger.error(Exception.format(:error, e, __STACKTRACE__))
      Resolution.put_result(res, {:error, Exception.message(e)})
  end
end
