defmodule Operately.Features.ProfilePageTest do
  use Operately.FeatureCase

  setup session do
    person = create_person("Mary Jane", "CEO")
    session = session |> UI.login() 

    {:ok, %{session: session, person: person}}
  end

  feature "see details about a person by visiting her profile", state do
    state
    |> visit_profile_page()
    |> UI.assert_text(state.person.full_name)
    |> UI.assert_text(state.person.title)
  end

  # ===========================================================================

  def create_person(full_name, title) do
    Operately.PeopleFixtures.person_fixture(%{
      full_name: full_name,
      title: title
    })
  end

  def visit_profile_page(state) do
    UI.visit(state, "/people/#{state.person.id}")
  end

end
