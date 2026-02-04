defmodule Operately.Data.Change050CreateBindingsBetweenPeopleAndCompanySpace do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{
    AccessBinding,
    AccessContext,
    AccessGroup,
    AccessGroupMembership,
    Company,
    Group,
    Person
  }

  @edit_access 70
  @standard_tag "standard"

  defmodule Company do
    use Operately.Schema

    schema "companies" do
      field :company_space_id, :binary_id
    end
  end

  defmodule Person do
    use Operately.Schema

    schema "people" do
      field :company_id, :binary_id
      field :suspended_at, :utc_datetime
    end
  end

  defmodule Group do
    use Operately.Schema

    schema "groups" do
    end
  end

  defmodule AccessContext do
    use Operately.Schema

    schema "access_contexts" do
      field :group_id, :binary_id
    end
  end

  defmodule AccessGroup do
    use Operately.Schema

    schema "access_groups" do
      field :person_id, :binary_id
      field :group_id, :binary_id
      field :tag, :string
    end
  end

  defmodule AccessBinding do
    use Operately.Schema

    schema "access_bindings" do
      field :group_id, :binary_id
      field :context_id, :binary_id
      field :access_level, :integer

      timestamps()
    end

    def changeset(binding, attrs) do
      binding
      |> cast(attrs, [:group_id, :context_id, :access_level])
      |> validate_required([:group_id, :context_id, :access_level])
    end
  end

  defmodule AccessGroupMembership do
    use Operately.Schema

    schema "access_group_memberships" do
      field :group_id, :binary_id
      field :person_id, :binary_id

      timestamps()
    end

    def changeset(group_membership, attrs) do
      group_membership
      |> cast(attrs, [:group_id, :person_id])
      |> validate_required([:group_id, :person_id])
    end
  end

  def run do
    Repo.transaction(fn ->
      companies = list_companies()

      Enum.each(companies, fn company ->
        people = list_people(company.id)

        create_bindings(company, people)
        create_memberships(company, people)
      end)
    end)
  end

  defp list_companies do
    from(c in Company, select: [:id, :company_space_id])
    |> Repo.all()
  end

  defp list_people(company_id) do
    from(p in Person, where: p.company_id == ^company_id and is_nil(p.suspended_at), select: [:id])
    |> Repo.all()
  end

  defp create_bindings(company = %Company{}, people) do
    company_space = get_company_space!(company)
    context = get_context!(company_space.id)

    Enum.each(people, fn p ->
      group = get_person_access_group!(p.id)
      create_binding(group.id, context.id)
    end)
  end

  defp create_binding(group_id, context_id) do
    case Repo.get_by(AccessBinding, group_id: group_id, context_id: context_id) do
      nil ->
        {:ok, _} = create_access_binding(group_id, context_id)

      _ ->
        :ok
    end
  end

  defp create_memberships(company = %Company{}, people) do
    space = get_company_space!(company)
    group = get_group_access_group!(space.id)

    Enum.each(people, fn p ->
      create_membership(p.id, group.id)
    end)
  end

  defp create_membership(person_id, group_id) do
    case Repo.get_by(AccessGroupMembership, person_id: person_id, group_id: group_id) do
      nil ->
        {:ok, _} = create_group_membership(person_id, group_id)

      _ ->
        :ok
    end
  end

  defp get_company_space!(%Company{company_space_id: company_space_id}) do
    Repo.get!(Group, company_space_id)
  end

  defp get_context!(group_id) do
    Repo.get_by!(AccessContext, group_id: group_id)
  end

  defp get_person_access_group!(person_id) do
    Repo.get_by!(AccessGroup, person_id: person_id)
  end

  defp get_group_access_group!(group_id) do
    Repo.get_by!(AccessGroup, group_id: group_id, tag: @standard_tag)
  end

  defp create_access_binding(group_id, context_id) do
    %AccessBinding{}
    |> AccessBinding.changeset(%{
      group_id: group_id,
      context_id: context_id,
      access_level: @edit_access
    })
    |> Repo.insert()
  end

  defp create_group_membership(person_id, group_id) do
    %AccessGroupMembership{}
    |> AccessGroupMembership.changeset(%{
      person_id: person_id,
      group_id: group_id
    })
    |> Repo.insert()
  end

end
