defmodule Mix.Operately do
  # Convinience function for mix tasks

  def generate_file(path, generator) do
    if File.exists?(path) do
      IO.puts "#{IO.ANSI.red()}Aborting#{IO.ANSI.reset()} #{path} already exists"
      System.halt(1)
    else
      generate_file!(path, generator)
    end
  end

  def generate_file!(path, generator) do
    IO.puts "#{IO.ANSI.green()}Generating#{IO.ANSI.reset()} #{path}"
    File.write!(path, generator.(path))
  end

  def inject_into_file(path, content, line) do
    IO.puts "#{IO.ANSI.green()}Injecting#{IO.ANSI.reset()} into #{path}"

    file = File.read!(path)
    lines = String.split(file, "\n")
    new_lines = List.insert_at(lines, line, content)
    new_file = Enum.join(new_lines, "\n")
    File.write!(path, new_file)
  end

  def indent(lines, spaces) do
    first_line = Enum.at(String.split(lines, "\n"), 0)
    rest_lines = Enum.drop(String.split(lines, "\n"), 1) |> Enum.map(fn line -> String.duplicate(" ", spaces) <> line end)
    all_lines = [first_line] ++ rest_lines

    Enum.join(all_lines, "\n")
  end

  def list_files(path, :basename, exclude: excluded) do
    path
    |> Path.wildcard()
    |> Enum.map(fn f -> Path.basename(f) end)
    |> Enum.map(fn f -> String.split(f, ".") |> Enum.at(0) end)
    |> Enum.filter(fn f -> f not in excluded end)
  end
end
