defmodule Operately.Data.Change094UpdateCompanyAdminBindingsToAdminAccess do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{AccessBinding, AccessContext, AccessGroup}

  @edit_access 70
  @admin_access 90

  def run do
    from(b in AccessBinding,
      join: g in AccessGroup, on: g.id == b.group_id,
      join: c in AccessContext, on: c.id == b.context_id,
      where: b.access_level == ^@edit_access and not is_nil(g.person_id) and not is_nil(c.company_id)
    )
    |> Repo.update_all(set: [access_level: @admin_access])
  end

  defmodule AccessBinding do
    use Operately.Schema

    schema "access_bindings" do
      field :access_level, :integer
      field :group_id, :binary_id
      field :context_id, :binary_id
    end
  end

  defmodule AccessGroup do
    use Operately.Schema

    schema "access_groups" do
      field :person_id, :binary_id
    end
  end

  defmodule AccessContext do
    use Operately.Schema

    schema "access_contexts" do
      field :company_id, :binary_id
    end
  end
end
