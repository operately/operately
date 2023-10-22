defmodule Mix.Operately do
  # Convinience function for mix tasks

  def generate_file(path, generator) do
    IO.puts "#{IO.ANSI.green()}Generating#{IO.ANSI.reset()} #{path}"

    File.write!(path, generator.(path))
  end

  def indent(lines, spaces) do
    first_line = Enum.at(String.split(lines, "\n"), 0)
    rest_lines = Enum.drop(String.split(lines, "\n"), 1) |> Enum.map(fn line -> String.duplicate(" ", spaces) <> line end)
    all_lines = [first_line] ++ rest_lines

    Enum.join(all_lines, "\n")
  end
end
