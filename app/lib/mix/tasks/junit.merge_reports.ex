defmodule Mix.Tasks.Junit.MergeReports do
  @moduledoc false
  @shortdoc "Merges JUnit XML reports into a single file"

  use Mix.Task

  alias Operately.JUnitReportMerger

  @impl Mix.Task
  def run([output | inputs]) do
    Mix.Task.run("app.start")

    output = Path.expand(output)
    inputs = Enum.map(inputs, &Path.expand/1)

    :ok = JUnitReportMerger.merge!(inputs, output)
  end
end
