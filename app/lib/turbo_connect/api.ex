defmodule TurboConnect.Api do
  defmacro __using__(opts \\ []) do
    default_source = Keyword.get(opts, :default_source, :internal)

    quote do
      import TurboConnect.Api
      require TurboConnect.Api

      Module.register_attribute(__MODULE__, :typemodules, accumulate: true)
      Module.register_attribute(__MODULE__, :queries, accumulate: true)
      Module.register_attribute(__MODULE__, :mutations, accumulate: true)
      Module.register_attribute(__MODULE__, :subscriptions, accumulate: true)
      Module.register_attribute(__MODULE__, :namespace_descriptions, accumulate: true)

      @before_compile unquote(__MODULE__)

      @turbo_connect_default_source unquote(default_source)

      use Plug.Builder

      plug Plug.Parsers, parsers: [:urlencoded, :json], json_decoder: Jason
      plug TurboConnect.Plugs.Match, __MODULE__
      plug TurboConnect.Plugs.ParseInputs

      def __default_source__, do: @turbo_connect_default_source
    end
  end

  defmacro use_types(module) do
    quote do
      @typemodules unquote(module)
    end
  end

  defmacro namespace(ns, opts \\ [], do: block) do
    quote do
      desc = Module.get_attribute(__MODULE__, :doc) || {nil, ""}
      namespace_desc = if is_tuple(desc), do: elem(desc, 1), else: ""
      Module.delete_attribute(__MODULE__, :doc)

      @namespace_descriptions {unquote(ns), namespace_desc}
      @tc_namespace unquote(ns)
      @tc_namespace_opts unquote(opts)
      unquote(block)
      @tc_namespace nil
      @tc_namespace_opts []
    end
  end

  defmacro query(name, module, opts \\ []) do
    quote do
      namespace = Module.get_attribute(__MODULE__, :tc_namespace)
      namespace_opts = Module.get_attribute(__MODULE__, :tc_namespace_opts) || []
      endpoint_opts = Keyword.merge(namespace_opts, unquote(opts))
      full_name = TurboConnect.Api.full_name(namespace, unquote(name))
      @queries {full_name, namespace, unquote(name), unquote(module), endpoint_opts}
    end
  end

  defmacro mutation(name, module, opts \\ []) do
    quote do
      namespace = Module.get_attribute(__MODULE__, :tc_namespace)
      namespace_opts = Module.get_attribute(__MODULE__, :tc_namespace_opts) || []
      endpoint_opts = Keyword.merge(namespace_opts, unquote(opts))
      full_name = TurboConnect.Api.full_name(namespace, unquote(name))
      @mutations {full_name, namespace, unquote(name), unquote(module), endpoint_opts}
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
        Enum.reduce(@typemodules, %{primitives: %{}, objects: %{}, unions: %{}, enums: %{}, int_enums: %{}}, fn module, acc ->
          primitives = apply(module, :__primitives__, [])
          objects = apply(module, :__objects__, [])
          unions = apply(module, :__unions__, [])
          enums = apply(module, :__enums__, [])
          int_enums = apply(module, :__int_enums__, [])

          primitives = Map.merge(acc.primitives, primitives)
          objects = Map.merge(acc.objects, objects)
          unions = Map.merge(acc.unions, unions)
          enums = Map.merge(acc.enums, enums)
          int_enums = Map.merge(acc.int_enums, int_enums)

          %{objects: objects, unions: unions, primitives: primitives, enums: enums, int_enums: int_enums}
        end)
      end

      def __queries__() do
        Enum.map(@queries, fn {full_name, namespace, name, module, opts} ->
          spec = %{
            inputs: module.__inputs__(),
            outputs: module.__outputs__(),
            handler: module,
            name: name,
            namespace: namespace,
            type: :query
          }

          {full_name, maybe_put_endpoint_opts(spec, opts)}
        end)
        |> Enum.into(%{})
      end

      def __mutations__() do
        Enum.map(@mutations, fn {full_name, namespace, name, module, opts} ->
          spec = %{
            inputs: module.__inputs__(),
            outputs: module.__outputs__(),
            handler: module,
            name: name,
            namespace: namespace,
            type: :mutation
          }

          {full_name, maybe_put_endpoint_opts(spec, opts)}
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
        query_namespaces = Enum.map(@queries, fn {_, namespace, _, _, _} -> namespace end)
        mutuation_namespaces = Enum.map(@mutations, fn {_, namespace, _, _, _} -> namespace end)
        subscription_namespaces = Enum.map(@subscriptions, fn {_, namespace, _, _} -> namespace end)
        all_namespaces = query_namespaces ++ mutuation_namespaces ++ subscription_namespaces

        Enum.uniq(all_namespaces)
      end

      def __namespace_descriptions__() do
        Enum.into(@namespace_descriptions, %{})
      end

      defp maybe_put_endpoint_opts(spec, opts) do
        case opts do
          [] -> spec
          _ -> Map.merge(spec, Map.new(opts))
        end
      end
    end
  end

  def full_name(nil, name), do: "#{name}"
  def full_name(namespace, name), do: "#{namespace}/#{name}"

  def default_source(api_module) do
    if function_exported?(api_module, :__default_source__, 0) do
      api_module.__default_source__()
    else
      :internal
    end
  end
end
