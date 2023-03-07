defmodule MyApp.Features.OkrsTest do
  use Operately.FeatureCase, file: "okrs.feature"

  defgiven ~r/^I am logged in as a user$/, _vars, state do
    # Your implementation here
  end

  defand ~r/^I am on the Objectives page$/, _vars, state do
    # Your implementation here
  end

  defwhen ~r/^I click on the Create Objective button$/, _vars, state do
    # Your implementation here
  end

  defand ~r/^I fill in the Objective Name field with "(?<name>[^"]+)"$/, %{name: name}, state do
    # Your implementation here
  end

  defand ~r/^I fill in the Objective Description field with "(?<description>[^"]+)"$/, %{description: description}, state do
    # Your implementation here
  end

  defand ~r/^I choose "(?<timeframe>[^"]+)" from the Timeframe dropdown$/, %{timeframe: timeframe}, state do
    # Your implementation here
  end

  defand ~r/^I click on the Create Objective and results button$/, _vars, state do
    # Your implementation here
  end

  defand ~r/^I add a Key Result with the name "(?<kr_name>[^"]+)" and the target value "(?<direction>[^"]+)" "(?<value>[^"]+)"$/, %{kr_name: name, direction: direction, value: value}, state do
    # Your implementation here
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the list of Objectives$/, %{name: name}, state do
    # Your implementation here
  end
end
