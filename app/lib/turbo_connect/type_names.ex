defmodule TurboConnect.TypeNames do
  @moduledoc """
  Resolves `__typename` strings from Elixir modules.

  Prefer an optional `mod.__api_typename__/0` override when present; otherwise
  derive from the module name:

  - `Operately.Activities.Content.Foo.Bar` → `"activity_content_foo_bar"`
  - `Operately.People.Permissions` → `"permissions"`
  - `Operately.WorkMaps.WorkMapItem` → `"work_map_item"`
  """

  def resolve(mod) when is_atom(mod) do
    Code.ensure_loaded(mod)

    if function_exported?(mod, :__api_typename__, 0) do
      mod.__api_typename__()
    else
      default_name_for_module(mod)
    end
  end

  def default_name_for_module(mod) when is_atom(mod) do
    case Module.split(mod) do
      ["Operately", "Activities", "Content" | rest] ->
        Enum.join(["activity_content" | Enum.map(rest, &Macro.underscore/1)], "_")

      parts ->
        parts |> List.last() |> Macro.underscore()
    end
  end
end
