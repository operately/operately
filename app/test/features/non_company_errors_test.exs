defmodule Operately.Features.NonCompanyErrorsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.UI

  feature "visiting a non-existing route outside company context", ctx do
    ctx
    |> UI.visit("/hello")
    |> UI.assert_text("Page Not Found")
    |> UI.assert_text("Sorry, we couldn't find that page you were looking for.")
  end

  feature "visiting a non-existing route with company-like path but invalid", ctx do
    ctx
    |> UI.visit("/invalid-company-id/some-page")
    |> UI.assert_text("Page Not Found")
  end
end