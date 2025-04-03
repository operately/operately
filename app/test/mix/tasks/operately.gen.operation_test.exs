defmodule Mix.Tasks.Operately.Gen.Operation.Task do
  use ExUnit.Case

  alias Mix.Tasks.Operately.Gen.Operation

  import Mock

  test "runs the generation without errors" do
    mocks = [
      {
        Mix.Operately,
        [:passthrough],
        [
          generate_file: fn _path, generator -> IO.puts(generator.("")) end,
          inject_into_file: fn path, content, line -> display_inject_context(path, content, line) end
        ]
      },
      {
        IO,
        [:passthrough],
        [gets: &gets/1]
      }
    ]

    with_mocks(mocks) do
      assert Operation.run([])
    end
  end

  defp gets("Enter resource name: (e.g project_milestone): "), do: "project\n"
  defp gets("Enter action name: (e.g create): "), do: "edit\n"
  defp gets(">  "), do: "company_id:string space_id:string name:string\n"
  defp gets("Continue? (y/n): "), do: "y\n"

  # A mock function. Instead of injecting into the file, we display the context
  # in which the injection would be made. A couple of lines before and after
  # the line where the injection would be made.
  defp display_inject_context(path, content, line) do
    file_content = File.read!(path) |> String.split("\n")

    IO.puts("")
    IO.puts("Injecting into #{path}")
    IO.puts("=====================================")
    IO.puts(Enum.at(file_content, line - 4))
    IO.puts(Enum.at(file_content, line - 3))
    IO.puts(Enum.at(file_content, line - 2))
    IO.puts(Enum.at(file_content, line - 1))

    IO.puts(content)

    IO.puts(Enum.at(file_content, line))
    IO.puts(Enum.at(file_content, line + 1))
    IO.puts(Enum.at(file_content, line + 2))
    IO.puts(Enum.at(file_content, line + 3))
    IO.puts(Enum.at(file_content, line + 4))
    IO.puts("=====================================")
    IO.puts("")
  end
end
