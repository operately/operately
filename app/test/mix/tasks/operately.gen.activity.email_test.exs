defmodule Mix.Tasks.Operately.Gen.Activity.EmailTest do
  use ExUnit.Case

  alias Mix.Tasks.Operately.Gen.Activity.Email

  import Mock

  test "generates email handler and templates for activity" do
    mocks = [
      {
        Mix.Operately,
        [:passthrough],
        [
          generate_file: fn _path, generator -> IO.puts(generator.("")) end
        ]
      }
    ]

    with_mocks(mocks) do
      assert Email.run(["goal_completed"])
    end
  end

  test "raises on missing argument" do
    assert_raise Mix.Error, fn ->
      Mix.Tasks.Operately.Gen.Activity.Email.run([])
    end
  end
end
