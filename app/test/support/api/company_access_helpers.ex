defmodule Operately.Support.Api.CompanyAccessHelpers do
  import Ecto.Query

  alias Operately.Access.{Binding, GroupMembership}
  alias Operately.Repo

  def company_access_snapshot(company) do
    context = Operately.Access.get_context!(company_id: company.id)

    %{
      bindings: Repo.all(from(b in Binding, where: b.context_id == ^context.id, order_by: b.id)),
      memberships: Repo.all(from(m in GroupMembership, join: g in assoc(m, :group), where: g.company_id == ^company.id, order_by: m.id)),
      activities: Repo.aggregate(Operately.Activities.Activity, :count)
    }
  end
end
