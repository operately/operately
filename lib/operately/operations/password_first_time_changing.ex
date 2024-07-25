defmodule Operately.Operations.PasswordFirstTimeChanging do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.People.{Account, Person}

  def run(attrs, invitation) do
    invitation = Repo.preload(invitation, [:admin, member: [:account]])

    Multi.new()
    |> change_password(attrs, invitation.member.account)
    |> update_member(invitation.member)
    |> insert_activity(invitation)
    |> Repo.transaction()
  end

  defp change_password(multi, attrs, account) do
    multi
    |> Multi.update(:member_account, Account.password_changeset(account, attrs))
  end

  defp update_member(multi, member) do
    multi
    |> Multi.update(:member, Person.changeset(member, %{has_open_invitation: false}))
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
