defmodule OperatelyEmail.Mailers.ActivityMailer do
  alias Operately.People.Person

  alias OperatelyEmail.Mailers.NotificationMailer, as: NotificationMailer

  defdelegate new(company), to: NotificationMailer
  defdelegate to(email, person), to: NotificationMailer
  defdelegate render(email, template), to: NotificationMailer
  defdelegate assign(email, key, value), to: NotificationMailer

  def from(email, person) do
    NotificationMailer.from(email, person.full_name <> " (Operately)")
  end

  def subject(email, where: where, who: who, action: action) do
    NotificationMailer.subject(email, "(#{where}) #{Person.short_name(who)} #{action}")
  end
end
