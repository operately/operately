defmodule TurboConnect.TsGen do
  @moduledoc """
  This module generates TypeScript code from the specs defined with TurboConnect.Specs.
  """

  import TurboConnect.TsGen.Typescript, only: [ts_interface: 2, ts_sum_type: 2]
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
    Enum.join([
      convert_objects(api_module.__types__().objects),
      convert_unions(api_module.__types__().unions),
      Queries.generate_types(api_module.__queries__()),
      Mutations.generate_types(api_module.__mutations__())
    ], "\n")
  end

  def generate_api_client_class(api_module) do
    """
    interface ApiClientConfig {
      basePath: string;
    }

    export class ApiClient {
      private basePath: string;

      configure(config: ApiClientConfig) {
        this.basePath = config.basePath;
      }

      getBasePath() {
        if (!this.basePath) {
          throw new Error("ApiClient is not configured");
        }

        return this.basePath;
      }

    #{Queries.generate_class_functions(api_module.__queries__())}
    #{Mutations.generate_class_functions(api_module.__mutations__())}
    }
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
          if (o.hasOwnProperty(origKey)) {
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
          if (o.hasOwnProperty(origKey)) {
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
    """
    const defaultApiClient = new ApiClient();

    #{Queries.generate_default_functions(api_module.__queries__())}
    #{Mutations.generate_default_functions(api_module.__mutations__())}

    #{Queries.generate_hooks(api_module.__queries__())}
    #{Mutations.generate_hooks(api_module.__mutations__())}
    export default {
      configureDefault: (config: ApiClientConfig) => defaultApiClient.configure(config),

    #{Queries.generate_default_exports(api_module.__queries__())}
    #{Mutations.generate_default_exports(api_module.__mutations__())}
    };
    """
  end

end
