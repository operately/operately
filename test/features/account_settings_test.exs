defmodule Operately.Features.AccountSettingsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.AccountSettingsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "changing operately's theme", ctx do
    ctx
    |> Steps.change_theme("light")
    |> Steps.assert_person_has_theme("light")
    |> Steps.change_theme("dark")
    |> Steps.assert_person_has_theme("dark")
    |> Steps.change_theme("system")
    |> Steps.assert_person_has_theme("system")
  end
end
