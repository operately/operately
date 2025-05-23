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

  defmacro namespace(ns, do: block) do
    quote do
      @tc_namespace unquote(ns)
      unquote(block)
      @tc_namespace nil
    end
  end

  defmacro query(name, module) do
    quote do
      namespace = Module.get_attribute(__MODULE__, :tc_namespace)
      full_name = TurboConnect.Api.full_name(namespace, unquote(name))
      @queries {full_name, namespace, unquote(name), unquote(module)}
    end
  end

  defmacro mutation(name, module) do
    quote do
      namespace = Module.get_attribute(__MODULE__, :tc_namespace)
      full_name = TurboConnect.Api.full_name(namespace, unquote(name))
      @mutations {full_name, namespace, unquote(name), unquote(module)}
    end
  end

  defmacro subscription(name, module) do
    quote do
      namespace = Module.get_attribute(__MODULE__, :tc_namespace)
      full_name = TurboConnect.Api.full_name(namespace, unquote(name))
      @subscriptions {full_name, namespace, unquote(name), unquote(module)}
    end
  end

  defmacro __before_compile__(_) do
    quote do
      plug TurboConnect.Plugs.RequiredFieldValidator
      plug TurboConnect.Plugs.Dispatch

      def __types__() do
        Enum.reduce(@typemodules, %{primitives: %{}, objects: %{}, unions: %{}, enums: %{}}, fn module, acc ->
          primitives = apply(module, :__primitives__, [])
          objects = apply(module, :__objects__, [])
          unions = apply(module, :__unions__, [])
          enums = apply(module, :__enums__, [])

          primitives = Map.merge(acc.primitives, primitives)
          objects = Map.merge(acc.objects, objects)
          unions = Map.merge(acc.unions, unions)
          enums = Map.merge(acc.enums, enums)

          %{objects: objects, unions: unions, primitives: primitives, enums: enums}
        end)
      end

      def __queries__() do
        Enum.map(@queries, fn {full_name, namespace, name, module} ->
          {full_name,
           %{
             inputs: module.__inputs__(),
             outputs: module.__outputs__(),
             handler: module,
             name: name,
             namespace: namespace,
             type: :query
           }}
        end)
        |> Enum.into(%{})
      end

      def __mutations__() do
        Enum.map(@mutations, fn {full_name, namespace, name, module} ->
          {full_name,
           %{
             inputs: module.__inputs__(),
             outputs: module.__outputs__(),
             handler: module,
             name: name,
             namespace: namespace,
             type: :mutation
           }}
        end)
        |> Enum.into(%{})
      end

      def __subscriptions__() do
        Enum.map(@subscriptions, fn {full_name, namespace, name, module} ->
          {full_name,
           %{
             handler: module,
             namespace: namespace,
             name: name
           }}
        end)
        |> Enum.into(%{})
      end

      def __namespaces__() do
        query_namespaces = Enum.map(@queries, fn {_, namespace, _, _} -> namespace end)
        mutuation_namespaces = Enum.map(@mutations, fn {_, namespace, _, _} -> namespace end)
        subscription_namespaces = Enum.map(@subscriptions, fn {_, namespace, _, _} -> namespace end)
        all_namespaces = query_namespaces ++ mutuation_namespaces ++ subscription_namespaces

        Enum.uniq(all_namespaces)
      end
    end
  end

  def full_name(nil, name), do: "#{name}"
  def full_name(namespace, name), do: "#{namespace}/#{name}"
end
