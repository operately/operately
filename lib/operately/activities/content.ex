defmodule Operately.Activities.Content do
  defmacro __using__(_) do
    quote do
      use Ecto.Schema
      import Ecto.Changeset

      @primary_key false
    end
  end

  def build(context, action, record) when is_atom(action) do
    module_name = action |> Atom.to_string() |> Macro.camelize()
    full_module_name = "Elixir.Operately.Activities.Content.#{module_name}"
    module = String.to_existing_atom(full_module_name)

    apply(module, :build, [context, record])
  end
end
