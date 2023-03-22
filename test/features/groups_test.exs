defmodule Operately.Features.GroupsTest do
  use Operately.FeatureCase, file: "groups.feature"

  alias Operately.Groups

  import_steps(Operately.Features.SharedSteps.Login)

  defgiven ~r/^that a group with the name "(?<name>[^"]+)" exists$/, %{name: name}, %{session: session} do
    Groups.create_group(%{name: name})
  end

  defwhen ~r/^I visit the groups page$/, _vars, %{session: session} do
    session |> visit("/groups")
  end

  defthen ~r/^I should see "(?<name>[^"]+)" in the list of groups$/, %{name: name}, %{session: session} do
    session |> assert_has(Query.text(name))
  end

  defwhen ~r/^I create a new group with the name "(?<name>[^"]+)"$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> click(Query.link("Add Group"))
    |> fill_in(Query.text_field("Name"), with: name)
    |> click(Query.button("Save"))
  end

  defthen ~r/^the new group "(?<name>[^"]+)" is listing on the groups page$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> assert_has(Query.text(name))
  end

  defwhen ~r/^I edit the group "(?<old_name>[^"]+)" and change the name to "(?<new_name>[^"]+)"$/, %{old_name: old_name, new_name: new_name}, %{session: session} do
    session
    |> visit("/groups")
    |> click(Query.link(old_name))
    |> click(Query.button("Edit"))
    |> fill_in(Query.text_field("Name"), with: new_name)
    |> click(Query.button("Save"))
  end

  defthen ~r/^the group "(?<name>[^"]+)" is no longer visible on the groups page$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> refute_has(Query.text(name))
  end

  defand ~r/^the group "(?<name>[^"]+)" is visible on the groups page$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> assert_has(Query.text(name))
  end

  defwhen ~r/^I delete the group "(?<name>[^"]+)"$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> click(Query.link("Delete"))
  end

  defthen ~r/^the group "(?<name>[^"]+)" is not listing on the groups page$/, %{name: name}, %{session: session} do
    session
    |> visit("/groups")
    |> refute_has(Query.text(name))
  end

end
