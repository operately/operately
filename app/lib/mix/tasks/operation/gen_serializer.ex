defmodule Mix.Tasks.Operation.GenSerializer do

  def gen(ctx) do
    fields = 
      ctx.activity_fields 
      |> Enum.map(fn {name, _} -> "#{name}: Serializer.serialize(content[\"#{name}\"], level: :essential)" end)
      |> Enum.join(",\n")

    Mix.Operately.generate_file(ctx.serializer_file_path, fn _ ->
      """
      defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.#{ctx.operation_module_name} do
        alias OperatelyWeb.Api.Serializer

        def serialize(content, level: :essential) do
          %{
            #{Mix.Operately.indent(fields, 6)}
          }
        end
      end
      """
    end)
  end

end
