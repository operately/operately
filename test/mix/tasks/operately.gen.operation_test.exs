defmodule Mix.Tasks.Operately.Gen.Operation.Task do
  use ExUnit.Case

  alias Mix.Tasks.Operately.Gen.Operation

  import Mock

  test "runs the generation without errors" do
    mocks = [
      {
        Mix.Operately,
        [:passthrough],
        [generate_file: fn _path, generator -> IO.puts(generator.("")) end]
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

  def gets("Enter resource name: (e.g project_milestone): "), do: "project\n"
  def gets("Enter action name: (e.g create): "), do: "edit\n"
  def gets(">  "), do: "company_id:string space_id:string name:string\n"
  def gets("Continue? (y/n): "), do: "y\n"
end
