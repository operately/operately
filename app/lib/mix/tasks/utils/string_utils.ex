defmodule Mix.Tasks.Operately.Utils.StringUtils do

  def to_camel(name) do
    name
    |> String.split("_")
    |> Enum.map(fn part -> String.capitalize(part) end)
    |> Enum.join("")
  end

  def verify_snake_case(name, example) do
    if String.contains?(name, "-") do
      raise "Should be snake case. Example: #{example}"
    end

    if String.contains?(name, " ") do
      raise "Should be snake case. Example: #{example}"
    end

    name
  end

end
