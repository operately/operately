defmodule TurboConnect.Api do

  defmacro __using__(_) do
    quote do
      import TurboConnect.Api
      require TurboConnect.Api

      Module.register_attribute(__MODULE__, :typemodules, accumulate: true)
      Module.register_attribute(__MODULE__, :queries, accumulate: true)
      Module.register_attribute(__MODULE__, :mutations, accumulate: true)
      Module.register_attribute(__MODULE__, :subscriptions, accumulate: true)

      @before_compile unquote(__MODULE__)

      use Plug.Builder

      plug Plug.Parsers, parsers: [:urlencoded, :json], json_decoder: Jason
      plug TurboConnect.Plugs.Match, __MODULE__
      plug TurboConnect.Plugs.ParseInputs
    end
  end

  defmacro use_types(module) do
    quote do
      @typemodules unquote(module)
    end
  end

  defmacro query(name, module) do
    quote do
      @queries {unquote(name), unquote(module)}
    end
  end

  defmacro mutation(name, module) do
    quote do
      @mutations {unquote(name), unquote(module)}
    end
  end

  defmacro subscription(name, module) do
    quote do
      @subscriptions {unquote(name), unquote(module)}
    end
  end

  defmacro __before_compile__(_) do
    quote do
      plug TurboConnect.Plugs.Dispatch

      def __types__() do
        Enum.reduce(@typemodules, %{primitives: %{}, objects: %{}, unions: %{}}, fn module, acc ->
          primitives = apply(module, :__primitives__, [])
          objects = apply(module, :__objects__, [])
          unions = apply(module, :__unions__, [])

          primitives = Map.merge(acc.primitives, primitives)
          objects = Map.merge(acc.objects, objects)
          unions = Map.merge(acc.unions, unions)

          %{objects: objects, unions: unions, primitives: primitives}
        end)
      end

      def __queries__() do
        Enum.map(@queries, fn {name, module} ->
          {name, %{inputs: module.__inputs__(), outputs: module.__outputs__(), handler: module}}
        end)
        |> Enum.into(%{})
      end

      def __mutations__() do
        Enum.map(@mutations, fn {name, module} ->
          {name, %{inputs: module.__inputs__(), outputs: module.__outputs__(), handler: module}}
        end)
        |> Enum.into(%{})
      end

      def __subscriptions__() do
        Enum.map(@subscriptions, fn {name, module} -> {name, module} end)
        |> Enum.into(%{})
      end
    end
  end

end
