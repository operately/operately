defmodule Operately.ApplicationTest do
  use ExUnit.Case, async: false

  @tag timeout: 120_000
  test "request dependencies outlive the endpoint during application startup and shutdown" do
    # A separate VM exercises the real application callback without stopping the
    # application shared by database and endpoint tests.
    {output, status} =
      System.cmd("mix", ["run", "--no-compile", "--no-start", "test/support/application_lifecycle.exs"],
        env: [{"MIX_ENV", "test"}],
        stderr_to_stdout: true
      )

    assert status == 0, output
  end
end
