defmodule Operately.InviteLinksFixtures do
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.InviteLinks

  def personal_invite_link_fixture(attrs \\ %{}) do
    attrs = Enum.into(attrs, %{})

    company_id =
      case attrs[:company_id] do
        nil -> company_fixture().id
        value -> value
      end

    author_id =
      case attrs[:author_id] do
        nil -> person_fixture_with_account(%{company_id: company_id}).id
        value -> value
      end

    person_id =
      case attrs[:person_id] do
        nil -> person_fixture_with_account(%{company_id: company_id, has_open_invitation: true}).id
        value -> value
      end

    {:ok, invite_link} =
      InviteLinks.create_personal_invite_link(%{
        company_id: company_id,
        author_id: author_id,
        person_id: person_id
      })

    invite_link
  end
end
