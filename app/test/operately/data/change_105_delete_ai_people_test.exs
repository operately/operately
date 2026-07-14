defmodule Operately.Data.Change105DeleteAiPeopleTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.PeopleFixtures

  alias Operately.Repo
  alias Operately.Support.Factory
  alias Operately.Data.Change105DeleteAiPeople, as: Change
  alias Operately.Data.Change105DeleteAiPeople.{Company, Person}

  setup do
    Factory.setup(%{})
  end

  test "deletes AI people while keeping humans and guests", ctx do
    human = person_fixture(%{company_id: ctx.company.id, full_name: "Human Member", type: :human})
    guest = person_fixture(%{company_id: ctx.company.id, full_name: "Guest Member", type: :guest})
    ai_id = insert_ai_person!(ctx.company.id, "Alfred Agent")

    enable_ai_feature!(ctx.company.id)

    Change.run()
    Change.run()

    assert Repo.get(Person, human.id)
    assert Repo.get(Person, guest.id)
    refute Repo.get(Person, ai_id)

    company = Repo.get!(Company, ctx.company.id)
    refute "ai" in (company.enabled_experimental_features || [])
  end

  defp insert_ai_person!(company_id, full_name) do
    now = NaiveDateTime.utc_now(:second)

    {:ok, person} =
      %Person{}
      |> Ecto.Changeset.change(%{
        id: Ecto.UUID.generate(),
        company_id: company_id,
        full_name: full_name,
        type: "ai",
        inserted_at: now,
        updated_at: now
      })
      |> Repo.insert()

    person.id
  end

  defp enable_ai_feature!(company_id) do
    company = Repo.get!(Company, company_id)
    features = Enum.uniq((company.enabled_experimental_features || []) ++ ["ai"])

    from(c in Company, where: c.id == ^company_id)
    |> Repo.update_all(set: [enabled_experimental_features: features])
  end
end
