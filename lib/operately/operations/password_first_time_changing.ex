defmodule Operately.Operations.PasswordFirstTimeChanging do
  alias Ecto.Multi
  alias Operately.Repo

  def run(attrs, invitation) do
    invitation = Repo.preload(invitation, [:admin, member: [:account]])

    Multi.new()
    |> change_password(attrs, invitation)
    |> insert_activity(invitation)
    |> Repo.transaction()
  end

  defp change_password(multi, attrs, invitation) do
    changeset = Operately.People.Account.password_changeset(
      invitation.member.account,
      attrs
    )

    Multi.update(multi, :password, changeset)
  end

  defp insert_activity(multi, invitation) do
    Operately.Activities.insert_sync(multi, invitation.member_id, :password_first_time_changed, fn _changes ->
      %{
        invitatition_id: invitation.id,
        company_id: invitation.admin.company_id,
        admin_name: invitation.admin.full_name,
        admin_email: invitation.admin.email,
        member_name: invitation.member.full_name,
        member_email: invitation.member.email,
      }
    end)
  end
end
