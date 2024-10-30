defmodule Mix.Tasks.Operation.GenApiTypes do

  def gen(ctx) do
    Mix.Operately.inject_into_file(
      ctx.api_types_file_path, 
      content(ctx), 
      find_insertion_point(ctx))
  end

  defp content(ctx) do
    fields = 
      ctx.activity_fields 
      |> Enum.map(fn {name, type} -> "field :#{name}, :#{type}" end)
      |> Enum.join("\n")

    [
      "  object :activity_content_#{ctx.resource}_#{ctx.action_gerund} do",
      "    #{Mix.Operately.indent(fields, 4)}",
      "  end",
      "",
    ]
    |> Enum.join("\n")
  end

  defp find_insertion_point(ctx) do
    ctx.api_types_file_path
    |> File.read!()
    |> String.split("\n")
    |> Enum.find_index(fn line -> String.contains?(line, "object :activity_content") end)
  end

end
