defmodule Mix.Tasks.Operately.AiQualityTester do
  @moduledoc """
  AI Quality Tester task for Operately.

  This task provides automated quality testing capabilities using AI.

  **Note: This task can only be run in the test environment.**

  ## Usage

      MIX_ENV=test mix operately.ai_quality_tester [options]

  ## Options

    * `--help` - Show this help message

  ## Examples

      MIX_ENV=test mix operately.ai_quality_tester
      MIX_ENV=test mix operately.ai_quality_tester --help

  """

  use Mix.Task

  @impl Mix.Task
  def run(_args) do
    ensure_test_env()
  end

  defp ensure_test_env do
    unless Mix.env() == :test do
      Mix.shell().error("This task can only be run in the test environment.")
      Mix.shell().error("Please run: MIX_ENV=test mix operately.ai_quality_tester")

      System.halt(1)
    end
  end
end
