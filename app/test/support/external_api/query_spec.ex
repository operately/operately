defmodule Operately.Support.ExternalApi.QuerySpec do
  @callback query_name() :: String.t()
  @callback setup(map()) :: map()
  @callback inputs(map()) :: map()
  @callback assert(any(), map()) :: any()

  @optional_callbacks [inputs: 1]

  defmacro __using__(_opts) do
    quote do
      @behaviour Operately.Support.ExternalApi.QuerySpec

      import ExUnit.Assertions

      @impl true
      def query_name do
        __MODULE__
        |> Module.split()
        |> List.last()
        |> Macro.underscore()
      end

      defoverridable query_name: 0
    end
  end
end
