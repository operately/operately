defmodule OperatelyWeb.SchemaUtils do
  defmacro import_all_types(folder) do
    folder = Path.join([__DIR__, folder])
    files = File.ls!(folder)

    files |> Enum.map(fn file ->
      [name, _ext] = String.split(file, ".")
      module_name = Macro.camelize(name)

      full_name = String.to_atom("Elixir.OperatelyWeb.GraphQL.Types.#{module_name}")

      quote do
        import_types unquote(full_name)
      end
    end)
  end

  defmacro import_all_queries(folder) do
    folder = Path.join([__DIR__, folder])
    files = File.ls!(folder)

    files |> Enum.map(fn file ->
      [name, _ext] = String.split(file, ".")
      module_name = Macro.camelize(name)

      full_module_name = String.to_atom("Elixir.OperatelyWeb.GraphQL.Queries.#{module_name}")
      field_name = Inflex.singularize(name) <> "_queries"

      quote do
        import_types unquote(full_module_name)

        query do
          import_fields unquote(field_name)
        end
      end
    end)
  end
end
