defmodule Operately.Companies.ExperimentalFeaturesTest do
  use ExUnit.Case, async: true

  alias Operately.Companies.ExperimentalFeatures

  test "available/0 lists the current experimental features" do
    assert ExperimentalFeatures.available() == ["project_templates"]
  end
end
