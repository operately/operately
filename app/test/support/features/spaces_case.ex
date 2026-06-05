defmodule Operately.Support.Features.SpacesCase do
  defmacro __using__(_) do
    quote do
      import Operately.GroupsFixtures
      import Operately.PeopleFixtures

      alias Operately.Access.Binding
      alias Operately.Support.Features.SpacesSteps, as: Steps

      setup ctx, do: Steps.setup(ctx)
    end
  end
end
