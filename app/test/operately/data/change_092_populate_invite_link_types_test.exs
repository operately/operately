defmodule Operately.Data.Change092PopulateInviteLinkTypesTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.InviteLinks.InviteLink
  alias Operately.Repo

  test "backfills invite link types as company_wide" do
    company = company_fixture()
    author = person_fixture_with_account(%{company_id: company.id})
    person = person_fixture_with_account(%{company_id: company.id})

    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    company_token = "company-" <> Ecto.UUID.generate()
    personal_token = "personal-" <> Ecto.UUID.generate()

    Repo.insert_all("invite_links", [
      %{
        id: Ecto.UUID.generate() |> Ecto.UUID.dump!(),
        token: company_token,
        company_id: Ecto.UUID.dump!(company.id),
        author_id: Ecto.UUID.dump!(author.id),
        type: nil,
        person_id: nil,
        inserted_at: now,
        updated_at: now
      },
      %{
        id: Ecto.UUID.generate() |> Ecto.UUID.dump!(),
        token: personal_token,
        company_id: Ecto.UUID.dump!(company.id),
        author_id: Ecto.UUID.dump!(author.id),
        type: "personal",
        person_id: Ecto.UUID.dump!(person.id),
        inserted_at: now,
        updated_at: now
      }
    ])
    company_link = Repo.get_by(InviteLink, token: company_token)
    personal_link = Repo.get_by(InviteLink, token: personal_token)

    assert company_link.type == nil
    assert personal_link.type == :personal

    Operately.Data.Change092PopulateInviteLinkTypes.run()

    company_link = Repo.reload(company_link)
    personal_link = Repo.reload(personal_link)

    assert company_link.type == :company_wide
    assert personal_link.type == :personal
  end
end
