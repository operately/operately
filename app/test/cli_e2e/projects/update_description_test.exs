defmodule Operately.CliE2E.Projects.UpdateDescriptionTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.Projects.UpdateDescriptionSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "updates a project description from file", ctx do
    ctx
    |> Steps.update_project_description_from_file("# Roadmap\n\n- Launch dashboard\n- Improve API latency")
    |> Steps.assert_project_description_updated_successfully()
  end
end
