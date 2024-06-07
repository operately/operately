defmodule TurboConnect.Api do

  defmacro __using__(_) do
    quote do
      import TurboConnect.Api
      require TurboConnect.Api

      Module.register_attribute(__MODULE__, :typemodules, accumulate: true)
      Module.register_attribute(__MODULE__, :queries, accumulate: true)

      @before_compile unquote(__MODULE__)
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

  defmacro __before_compile__(_) do
    quote do
      def __types__() do
        Enum.reduce(@typemodules, %{objects: %{}, unions: %{}}, fn module, acc ->
          objects = apply(module, :__objects__, [])
          unions = apply(module, :__unions__, [])

          objects = Map.merge(acc.objects, objects)
          unions = Map.merge(acc.unions, unions)

          %{objects: objects, unions: unions}
        end)
      end

      def get_queries() do
        @queries
      end
    end
  end

end
