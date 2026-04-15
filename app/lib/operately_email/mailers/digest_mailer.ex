defmodule OperatelyEmail.Mailers.DigestMailer do
  import OperatelyEmail.Mailers.NotificationMailer

  def send(person, batch, digest_items) do
    person
    |> build_digest_email(batch, digest_items)
    |> OperatelyEmail.Mailers.BaseMailer.deliver_now()
  end

  def send_daily_summary(person, digest_items) do
    person
    |> build_daily_summary_email(digest_items)
    |> OperatelyEmail.Mailers.BaseMailer.deliver_now()
  end

  def build_digest_email(person, _batch, digest_items) do
    company = Operately.Repo.preload(person, :company).company

    parent_groups = group_by_parent(digest_items)
    total_updates = calculate_total_updates(parent_groups)
    notifications_url = OperatelyWeb.Paths.notifications_path(company) |> OperatelyWeb.Paths.to_url()
    settings_url = OperatelyWeb.Paths.account_notification_settings_path(company) |> OperatelyWeb.Paths.to_url()
    subject = "You have #{total_updates} new #{if total_updates == 1, do: "update", else: "updates"}"

    assigns = %{
      subject: subject,
      total_updates: total_updates,
      parent_groups: parent_groups,
      notifications_url: notifications_url,
      settings_url: settings_url
    }

    Swoosh.Email.new()
    |> Swoosh.Email.to(person.email)
    |> Swoosh.Email.from({"Operately", OperatelyEmail.notification_email_address()})
    |> Swoosh.Email.subject(subject)
    |> Swoosh.Email.html_body(html("buffered_activity_digest", assigns))
    |> Swoosh.Email.text_body(text("buffered_activity_digest", assigns))
  end

  def build_daily_summary_email(person, digest_items) do
    company = Operately.Repo.preload(person, :company).company

    parent_groups = group_by_parent(digest_items)
    total_updates = calculate_total_updates(parent_groups)
    notifications_url = OperatelyWeb.Paths.notifications_path(company) |> OperatelyWeb.Paths.to_url()
    settings_url = OperatelyWeb.Paths.account_notification_settings_path(company) |> OperatelyWeb.Paths.to_url()
    subject = "You have #{total_updates} new #{if total_updates == 1, do: "update", else: "updates"}"

    assigns = %{
      subject: subject,
      total_updates: total_updates,
      parent_groups: parent_groups,
      notifications_url: notifications_url,
      settings_url: settings_url
    }

    Swoosh.Email.new()
    |> Swoosh.Email.to(person.email)
    |> Swoosh.Email.from({"Operately", OperatelyEmail.notification_email_address()})
    |> Swoosh.Email.subject(subject)
    |> Swoosh.Email.html_body(html("daily_activity_digest", assigns))
    |> Swoosh.Email.text_body(text("daily_activity_digest", assigns))
  end

  defp calculate_total_updates(parent_groups) do
    parent_groups
    |> Enum.reduce(0, fn group, acc ->
      group_total = Enum.reduce(group.author_groups, 0, fn ag, ag_acc ->
        ag_acc + length(ag.items)
      end)
      acc + group_total
    end)
  end

  defp group_by_parent(digest_items) do
    digest_items
    |> Enum.group_by(fn item -> {item.parent_type, item.parent_id} end)
    |> Enum.map(fn {{_parent_type, _parent_id}, items} ->
      author_groups = group_by_author(items)
      earliest_occurred_at = items |> Enum.map(& &1.occurred_at) |> Enum.min(&NaiveDateTime.before?/2)

      %{
        parent_name: hd(items).parent_name,
        author_groups: author_groups,
        earliest_occurred_at: earliest_occurred_at
      }
    end)
    |> Enum.sort_by(& &1.earliest_occurred_at, &NaiveDateTime.before?/2)
  end

  defp group_by_author(items) do
    items
    |> Enum.group_by(fn item -> item.actor_name end)
    |> Enum.map(fn {actor_name, actor_items} ->
      sorted_items = Enum.sort_by(actor_items, & &1.occurred_at, &NaiveDateTime.before?/2)

      %{
        actor_name: actor_name,
        items: sorted_items
      }
    end)
    |> Enum.sort_by(fn group ->
      hd(group.items).occurred_at
    end, &NaiveDateTime.before?/2)
  end
end
