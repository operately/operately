defmodule OperatelyWeb.SchemaUtils do
  defmacro import_all_types(folder) do
    folder = Path.join([__DIR__, folder])
    files = File.ls!(folder)

    files |> Enum.map(fn file ->
      [name, _ext] = String.split(file, ".")
      module_name = Macro.camelize(name)

      full_name = String.to_atom("Elixir.OperatelyWeb.GraphQL.Types.#{module_name}")

      quote do
        if !Code.ensure_loaded?(unquote(full_name)) do
          Code.require_file(unquote(file), unquote(folder))
        end

        import_types unquote(full_name)
      end
    end)
  end
end
