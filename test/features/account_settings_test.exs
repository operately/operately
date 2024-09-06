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

  feature "changing name in account settings", ctx do
    ctx
    |> Steps.open_account_settings()
    |> Steps.change_name("John Doe")
    |> Steps.assert_person_name_changed("John Doe")
  end

  feature "changing title in company via account settings", ctx do
    ctx
    |> Steps.open_account_settings()
    |> Steps.change_title("Founder")
    |> Steps.assert_person_title_changed("Founder")
  end

  feature "changing the timezone in account settings", ctx do
    props = %{
      value: "Europe/Belgrade",
      label: "(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague"
    }

    ctx
    |> Steps.open_account_settings()
    |> Steps.change_timezone(props)
    |> Steps.assert_person_timezone_changed(props)
  end

  feature "setting my manager in account settings", ctx do
    ctx
    |> Steps.open_account_settings()
    |> Steps.given_a_person_exists_in_company("John Adams")
    |> Steps.set_select_manager_from_list()
    |> Steps.set_manager("John Adams")
    |> Steps.assert_person_manager_set("John Adams")
  end

  feature "setting that I don't have a manager in account settings", ctx do
    ctx
    |> Steps.given_that_i_have_a_manager()
    |> Steps.open_account_settings()
    |> Steps.set_no_manager()
    |> Steps.assert_person_has_no_manager()
  end
end
