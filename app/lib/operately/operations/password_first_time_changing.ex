defmodule Operately.Operations.PasswordFirstTimeChanging do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.People.Account

  def run(attrs, invite_link) do
    invite_link = Repo.preload(invite_link, [:author, person: [:account]])
    member = invite_link.person
    admin = invite_link.author

    Multi.new()
    |> change_password(attrs, member.account)
    |> deactivate_invite_link(invite_link)
    |> insert_activity(invite_link, admin, member)
    |> Repo.transaction()
  end

  defp change_password(multi, attrs, account) do
    multi
    |> Multi.update(:member_account, password_changeset(account, attrs))
  end

  defp deactivate_invite_link(multi, invite_link) do
    Multi.update(multi, :invite_link, Operately.InviteLinks.InviteLink.changeset(invite_link, %{is_active: false}))
  end

  defp insert_activity(multi, invite_link, admin, member) do
    Operately.Activities.insert_sync(multi, member.id, :password_first_time_changed, fn _changes ->
      %{
        invite_link_id: invite_link.id,
        company_id: admin.company_id,
        admin_name: admin.full_name,
        admin_email: admin.email,
        member_name: member.full_name,
        member_email: member.email,
      }
    end)
  end

  defp password_changeset(account, attrs) do
    account
    |> Account.password_changeset(attrs)
    |> maybe_set_first_login_at(account)
  end

  defp maybe_set_first_login_at(changeset, %Account{first_login_at: nil}) do
    Ecto.Changeset.change(changeset, first_login_at: DateTime.utc_now() |> DateTime.truncate(:second))
  end

  defp maybe_set_first_login_at(changeset, _account), do: changeset
end
