defmodule TurboConnect.TsGen do
  @moduledoc """
  This module generates TypeScript code from the specs defined with TurboConnect.Specs.
  """

  import TurboConnect.TsGen.Typescript, only: [ts_interface: 2, ts_sum_type: 2]
  alias TurboConnect.TsGen.{Queries, Mutations}

  @spec generate(module) :: String.t()
  def generate(api_module) do
    """
    import React from "react";
    import axios from "axios";

    #{convert_objects(api_module.__types__().objects)}
    #{convert_unions(api_module.__types__().unions)}
    #{Queries.define_generic_use_query_hook()}
    #{Queries.generate_queries(api_module.__queries__())}
    #{Mutations.define_generic_use_mutation_hook()}
    #{Mutations.generate_mutations(api_module.__mutations__())}
    """
  end

  def convert_objects(objects) do
    Enum.map_join(objects, "\n", fn {name, object} -> ts_interface(name, object.fields) end)
  end

  def convert_unions(unions) do
    Enum.map_join(unions, "\n", fn {name, types} -> ts_sum_type(name, types) end)
  end

end
