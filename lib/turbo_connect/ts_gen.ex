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
