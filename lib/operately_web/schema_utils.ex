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

    results = Enum.map(files, fn file ->
      [name, _ext] = String.split(file, ".")
      module_name = Macro.camelize(name)

      module = String.to_atom("Elixir.OperatelyWeb.GraphQL.Queries.#{module_name}")
      field = String.to_atom(Inflex.singularize(name) <> "_queries")
      
      {module, field}
    end)

    modules = Enum.map(results, fn {module, _} -> module end)
    fields = Enum.map(results, fn {_, field} -> field end)

    imports = Enum.map(modules, fn module ->
      quote do
        import_types unquote(module)
      end
    end)

    fields = Enum.map(fields, fn field ->
      quote do
        import_fields unquote(field)
      end
    end)

    quote do
      unquote(imports)

      query do
        unquote(fields)
      end
    end
  end

  defmacro import_all_mutations(folder) do
    folder = Path.join([__DIR__, folder])
    files = File.ls!(folder)

    results = Enum.map(files, fn file ->
      [name, _ext] = String.split(file, ".")
      module_name = Macro.camelize(name)

      module = String.to_atom("Elixir.OperatelyWeb.GraphQL.Mutations.#{module_name}")
      field = String.to_atom(Inflex.singularize(name) <> "_mutations")
      
      {module, field}
    end)

    modules = Enum.map(results, fn {module, _} -> module end)
    fields = Enum.map(results, fn {_, field} -> field end)

    imports = Enum.map(modules, fn module ->
      quote do
        import_types unquote(module)
      end
    end)

    fields = Enum.map(fields, fn field ->
      quote do
        import_fields unquote(field)
      end
    end)

    quote do
      unquote(imports)

      mutation do
        unquote(fields)
      end
    end
  end
end
