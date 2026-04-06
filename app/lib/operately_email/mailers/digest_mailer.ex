defmodule OperatelyEmail.Mailers.DigestMailer do
  import OperatelyEmail.Mailers.NotificationMailer

  def send(person, batch, digest_items) do
    person
    |> build_digest_email(batch, digest_items)
    |> OperatelyEmail.Mailers.BaseMailer.deliver_now()
  end

  def build_digest_email(person, batch, digest_items) do
    company = Operately.Repo.preload(person, :company).company

    parent_groups = group_by_parent(digest_items)
    notifications_url = OperatelyWeb.Paths.notifications_path(company) |> OperatelyWeb.Paths.to_url()
    subject = "Updates from the last #{batch.window_minutes} minutes"

    assigns = %{
      subject: subject,
      window_minutes: batch.window_minutes,
      parent_groups: parent_groups,
      notifications_url: notifications_url
    }

    Swoosh.Email.new()
    |> Swoosh.Email.to(person.email)
    |> Swoosh.Email.from({"Operately", OperatelyEmail.notification_email_address()})
    |> Swoosh.Email.subject(subject)
    |> Swoosh.Email.html_body(html("buffered_activity_digest", assigns))
    |> Swoosh.Email.text_body(text("buffered_activity_digest", assigns))
  end

  defp group_by_parent(digest_items) do
    digest_items
    |> Enum.group_by(fn item -> {item.parent_type, item.parent_id} end)
    |> Enum.map(fn {{_parent_type, _parent_id}, items} ->
      sorted_items = Enum.sort_by(items, & &1.occurred_at, NaiveDateTime)

      %{
        parent_name: hd(items).parent_name,
        items: sorted_items
      }
    end)
    |> Enum.sort_by(fn group ->
      hd(group.items).occurred_at
    end, NaiveDateTime)
  end
end
