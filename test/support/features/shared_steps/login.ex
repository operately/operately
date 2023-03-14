defmodule Operately.Features.SharedSteps.Login do
  use Cabbage.Feature

  defgiven ~r/^I am logged in as a user$/, _vars, state do
    path = URI.encode("/accounts/auth/test_login?email=john@johnson.com")

    visit(state.session, path)
  end
end
