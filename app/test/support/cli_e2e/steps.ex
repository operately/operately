defmodule Operately.Support.CliE2E do
  defmacro __using__(_) do
    quote do
      import Ecto.Query
      import ExUnit.Assertions
      import ExUnit.Callbacks, only: [on_exit: 1]
      import Operately.CliE2ECase
      import Operately.FeatureSteps

      alias Operately.Repo
      alias Operately.Support.Factory
    end
  end
end
