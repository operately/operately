defmodule Mix.Tasks.Operation.GenApiTypes do
  def gen(ctx) do
    Mix.Operately.inject_into_file(
      ctx.api_types_file_path,
      content(ctx),
      find_insertion_point(ctx)
    )
  end

  defp content(ctx) do
    fields =
      ctx.activity_fields
      |> Enum.map(&create_field/1)
      |> Enum.join("\n")

    [
      "  object :activity_content_#{ctx.resource}_#{ctx.action_gerund} do",
      "    #{Mix.Operately.indent(fields, 4)}",
      "  end",
      ""
    ]
    |> Enum.join("\n")
  end

  defp find_insertion_point(ctx) do
    ctx.api_types_file_path
    |> File.read!()
    |> String.split("\n")
    |> Enum.find_index(fn line -> String.contains?(line, "object :activity_content") end)
  end

  defp create_field({name, type}) do
    case String.to_atom(type) do
      :company -> "field :#{remove_id(name)}, :company"
      :space -> "field :#{remove_id(name)}, :space"
      :person -> "field :#{remove_id(name)}, :person"
      :project -> "field :#{remove_id(name)}, :project"
      :goal -> "field :#{remove_id(name)}, :goal"
      type -> "field :#{name}, #{type}"
    end
  end

  defp remove_id(name) do
    String.replace(name, ~r/_id$/, "")
  end
end
