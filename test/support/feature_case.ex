defmodule Operately.FeatureCase do
  @moduledoc """
  This module defines the test case to be used by
  features inside of test/features.

  Such tests rely on the database being reset between
  each test. This is done by using the `async: false`
  option in the `use Cabbage.Feature` macro.
  """

  defmacro __using__([file: file]) do
    quote do
      alias Operately.Repo

      import Ecto
      import Ecto.Changeset
      import Ecto.Query
      import Operately.DataCase

      use Cabbage.Feature, async: false, file: unquote(file)
      use Wallaby.Feature

      setup tags do
        Operately.DataCase.setup_sandbox(async: false)

        :ok
      end
    end
  end
end
