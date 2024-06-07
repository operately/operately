defmodule TurboConnect.Api do

  defmacro __using__(_) do
    quote do
      import TurboConnect.Api
      require TurboConnect.Api

      Module.register_attribute(__MODULE__, :typemodules, accumulate: true)

      @before_compile unquote(__MODULE__)
    end
  end

  defmacro use_types(module) do
    quote do
      @typemodules unquote(module)
    end
  end

  defmacro __before_compile__(_) do
    quote do
      def get_types() do
        Enum.reduce(@typemodules, %{objects: %{}, unions: %{}}, fn module, acc ->
          specs = apply(module, :get_specs, [])

          objects = Map.merge(acc.objects, specs.objects)
          unions = Map.merge(acc.unions, specs.unions)

          %{objects: objects, unions: unions}
        end)
      end
    end
  end

end
