defmodule Mix.Tasks.Operation.GenSerializer do
  def gen(ctx) do
    fields =
      ctx.activity_fields
      |> Enum.map(&create_field/1)
      |> Enum.join(",\n")

    Mix.Operately.generate_file(ctx.serializer_file_path, fn _ ->
      """
      defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.#{ctx.activity_item_name} do
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

  defp create_field({name, type}) do
    res = "#{name}: Serializer.serialize(content[\"#{name}\"], level: :essential)"

    if full_object?(type) do
      res = res <> ",\n"

      res <> "#{remove_id(name)}: Serializer.serialize(content[\"#{remove_id(name)}\"], level: :essential)"
    else
      res
    end
  end

  defp full_object?(type) do
    String.to_atom(type) in [:company, :space, :person, :project, :goal]
  end

  defp remove_id(name) do
    String.replace(name, ~r/_id$/, "")
  end
end
