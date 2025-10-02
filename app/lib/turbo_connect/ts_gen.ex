defmodule TurboConnect.TsGen do
  @moduledoc """
  This module generates TypeScript code from the specs defined with TurboConnect.Specs.
  """

  import TurboConnect.TsGen.Typescript,
    only: [
      ts_interface: 2,
      ts_sum_type: 2,
      ts_type_alias: 2,
      ts_enum: 2,
      ts_function_name: 1,
      ts_type: 1
    ]

  alias TurboConnect.TsGen.{Queries, Mutations}

  @spec generate(module) :: String.t()
  def generate(api_module) do
    """
    #{generate_imports()}
    #{to_camel_case()}
    #{to_snake_case()}
    #{Queries.define_generic_use_query_hook()}
    #{Mutations.define_generic_use_mutation_hook()}
    #{generate_types(api_module)}
    #{generate_namespaces(api_module)}
    #{generate_api_client_class(api_module)}
    #{generate_default_exports(api_module)}
    """
  end

  def generate_imports() do
    """
    import React from "react";
    import axios from "axios";
    """
  end

  def generate_types(api_module) do
    Enum.join(
      [
        convert_primitives(api_module.__types__().primitives),
        convert_objects(api_module.__types__().objects),
        convert_unions(api_module.__types__().unions),
        convert_enums(api_module.__types__().enums),
        Queries.generate_types(api_module.__queries__()),
        Mutations.generate_types(api_module.__mutations__())
      ],
      "\n"
    )
  end

  def generate_namespaces(api_module) do
    api_module.__namespaces__()
    |> Enum.map(fn namespace -> generate_namespace(api_module, namespace) end)
    |> Enum.join("\n")
  end

  defp generate_namespace(api_module, namespace) do
    queries =
      api_module.__queries__() |> Enum.filter(fn {_, %{namespace: ns}} -> ns == namespace end)

    mutations =
      api_module.__mutations__() |> Enum.filter(fn {_, %{namespace: ns}} -> ns == namespace end)

    namespace_name =
      if namespace == nil, do: "api_namespace_root", else: "api_namespace_#{namespace}"

    """
    class #{Macro.camelize(namespace_name)} {
      constructor(private client: ApiClient) {}

    #{Queries.generate_functions(queries)}
    #{Mutations.generate_functions(mutations)}
    };
    """
  end

  def generate_api_client_class(api_module) do
    """
    export class ApiClient {
      private basePath: string;
      private headers: any;
    #{namespace_definitions(api_module)}

      constructor() {
    #{namespace_initializers(api_module)}
      }

      setBasePath(basePath: string) {
        this.basePath = basePath;
      }

      getBasePath() {
        if (!this.basePath) throw new Error("ApiClient is not configured");
        return this.basePath;
      }

      setHeaders(headers: any) {
        this.headers = headers;
      }

      getHeaders() {
        return this.headers || {};
      }

      // @ts-ignore
      async post(path: string, data: any) {
        const response = await axios.post(this.getBasePath() + path, toSnake(data), { headers: this.getHeaders() });
        return toCamel(response.data);
      }

      // @ts-ignore
      async get(path: string, params: any) {
        const response = await axios.get(this.getBasePath() + path, { params: toSnake(params), headers: this.getHeaders() });
        return toCamel(response.data);
      }

    #{generate_root_namespace_delegators(api_module)}
    }
    """
  end

  def namespace_definitions(api_module) do
    api_module.__namespaces__()
    |> Enum.map(fn namespace ->
      ns = Macro.camelize(if namespace == nil, do: "root", else: to_string(namespace))
      "  public apiNamespace#{ns}: ApiNamespace#{ns};"
    end)
    |> Enum.join("\n")
  end

  def namespace_initializers(api_module) do
    api_module.__namespaces__()
    |> Enum.map(fn namespace ->
      ns = Macro.camelize(if namespace == nil, do: "root", else: to_string(namespace))

      "    this.apiNamespace#{ns} = new ApiNamespace#{ns}(this);"
    end)
    |> Enum.join("\n")
  end

  def generate_root_namespace_delegators(api_module) do
    """
    #{Queries.generate_root_namespace_delegators(api_module.__queries__())}
    #{Mutations.generate_root_namespace_delegators(api_module.__mutations__())}
    """
  end

  def convert_objects(objects) do
    objects
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, object} -> ts_interface(name, object.fields) end)
  end

  def convert_unions(unions) do
    unions
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, types} -> ts_sum_type(name, types) end)
  end

  def convert_enums(enums) do
    enums
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, types} -> ts_enum(name, types) end)
  end

  def convert_primitives(primitives) do
    primitives
    |> Enum.sort_by(&elem(&1, 0))
    |> Enum.map_join("\n", fn {name, opts} ->
      encoded_type = Keyword.get(opts, :encoded_type)
      ts_type_alias(name, encoded_type)
    end)
  end

  def to_camel_case do
    """
    function toCamel(o : any) {
      var newO : any, origKey : any, newKey : any, value : any;

      if (o instanceof Array) {
        return o.map(function(value) {
            if (typeof value === "object") {
              value = toCamel(value)
            }
            return value
        })
      } else {
        newO = {}
        for (origKey in o) {
          if (o.hasOwnProperty(origKey) && typeof o[origKey] !== "undefined") {
            newKey = origKey.replace(/_([a-z])/g, function(_a : string, b : string) { return b.toUpperCase() })
            value = o[origKey]
            if (value instanceof Array || (value !== null && value.constructor === Object)) {
              value = toCamel(value)
            }
            newO[newKey] = value
          }
        }
      }
      return newO
    }
    """
  end

  def to_snake_case do
    """
    function toSnake(o : any) {
      var newO : any, origKey : any, newKey : any, value : any;

      if (o instanceof Array) {
        return o.map(function(value) {
            if (typeof value === "object") {
              value = toSnake(value)
            }
            return value
        })
      } else {
        newO = {}
        for (origKey in o) {
          if (o.hasOwnProperty(origKey) && typeof o[origKey] !== "undefined") {
            newKey = origKey.replace(/([A-Z])/g, function(a : string) { return "_" + a.toLowerCase() })
            value = o[origKey]
            if (value instanceof Array || (value !== null && value.constructor === Object)) {
              value = toSnake(value)
            }
            newO[newKey] = value
          }
        }
      }
      return newO
    }
    """
  end

  def generate_default_exports(api_module) do
    root_queries =
      api_module.__queries__() |> Enum.filter(fn {_, %{namespace: ns}} -> ns == nil end)

    root_mutations =
      api_module.__mutations__() |> Enum.filter(fn {_, %{namespace: ns}} -> ns == nil end)

    """
    const defaultApiClient = new ApiClient();

    #{Queries.generate_default_functions(root_queries)}
    #{Mutations.generate_default_functions(root_mutations)}

    #{Queries.generate_hooks(root_queries)}
    #{Mutations.generate_hooks(root_mutations)}
    export default {
      default: defaultApiClient,

    #{Queries.generate_default_root_exports(root_queries)}
    #{Mutations.generate_default_root_exports(root_mutations)}

    #{generate_default_namespace_exports(api_module)}
    };
    """
  end

  def generate_default_namespace_exports(api_module) do
    api_module.__namespaces__()
    |> Enum.filter(fn namespace -> namespace != nil end)
    |> Enum.map(fn namespace ->
      generate_default_namespace_export(api_module, namespace)
    end)
    |> Enum.join("\n")
  end

  def generate_default_namespace_export(api_module, namespace) do
    queries =
      api_module.__queries__()
      |> Enum.filter(fn {_, %{namespace: ns}} -> ns == namespace end)
      |> Enum.map(fn {fullname, %{name: name, namespace: ns}} ->
        fnName = ts_function_name(name)
        hookName = ts_function_name("use_#{name}")

        fnCall =
          "defaultApiClient.apiNamespace#{Macro.camelize(to_string(ns))}.#{ts_function_name(name)}(input)"

        input_type = ts_type(fullname) <> "Input"
        result_type = ts_type(fullname) <> "Result"

        """
            #{fnName}: (input: #{input_type}) => #{fnCall},
            #{hookName}: (input: #{input_type}) => useQuery<#{result_type}>(() => #{fnCall}),
        """
      end)
      |> Enum.join("\n")

    mutations =
      api_module.__mutations__()
      |> Enum.filter(fn {_, %{namespace: ns}} -> ns == namespace end)
      |> Enum.map(fn {fullname, %{name: name, namespace: ns}} ->
        fnName = ts_function_name(name)
        hookName = ts_function_name("use_#{name}")

        fnCall =
          "defaultApiClient.apiNamespace#{Macro.camelize(to_string(ns))}.#{ts_function_name(name)}"

        input_type = ts_type(fullname) <> "Input"
        result_type = ts_type(fullname) <> "Result"

        """
            #{fnName}: (input: #{input_type}) => #{fnCall}(input),
            #{hookName}: () => useMutation<#{input_type}, #{result_type}>((input) => #{fnCall}(input)),
        """
      end)
      |> Enum.join("\n")

    """
      #{namespace}: {
    #{queries}
    #{mutations}
      },
    """
  end
end
