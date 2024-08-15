defmodule Operately.Support.Features.UI.Emails do
  use ExUnit.CaseTemplate

  alias __MODULE__.SentEmail
  alias __MODULE__.SentEmails

  def assert_email_sent(subject, receiver) do
    {found, emails} = retry(times: 50, sleep: 200, fun: fn -> 
      emails = list_sent_emails()
      found = SentEmails.any?(emails, %{subject: subject, to: receiver})

      if found do
        {:ok, {found, emails}}
      else
        {:error, {found, emails}}
      end
    end)

    error = assert_email_error_message(emails, subject, receiver, "Expected email to be sent")
    assert found, error
  end

  def refute_email_sent(subject, receiver) do
    {found, emails} = retry(times: 10, sleep: 200, fun: fn -> 
      emails = list_sent_emails()
      found = SentEmails.any?(emails, %{subject: subject, to: receiver})

      if !found do
        {:ok, {found, emails}}
      else
        {:error, {found, emails}}
      end
    end)

    error = assert_email_error_message(emails, subject, receiver, "Expected email not to be sent")
    refute !found, error
  end

  def list_sent_emails do
    {:messages, messages} = Process.info(self(), :messages)

    messages
    |> Enum.filter(fn m -> match?({:delivered_email, _}, m) end)
    |> Enum.map(fn {:delivered_email, email} -> email end)
    |> SentEmails.new()
  end

  def last_sent_email() do
    list_sent_emails() |> List.last()
  end

  def find_link(email, text) do
    email.html
    |> Floki.find("a[href]") 
    |> Enum.filter(fn el -> Floki.text(el) == text end)
    |> Floki.attribute("href")
    |> case do
      [] -> 
        raise "No links found in email with text: #{text}"

      links ->
        links
        |> List.first()
        |> String.replace(OperatelyWeb.Endpoint.url(), "")
    end
  end

  defp assert_email_error_message(emails, title, to, error_title) do
    """
    #{error_title}
    #{SentEmail.as_string(%{subject: title, to: [to]})}

    Sent emails:
    #{SentEmails.as_string(emails)}
    """
  end

  defp retry(times: times, sleep: sleep, fun: fun) do
    case fun.() do
      {:ok, result} -> result

      {:error, _result} when times > 0 ->
        Process.sleep(sleep)
        retry(times: times - 1, sleep: sleep, fun: fun)

      {:error, result} when times == 0 ->
        result
    end
  end

  defmodule SentEmail do
    defstruct subject: nil, to: nil, html: nil, text: nil

    def new(bamboo_email = %Bamboo.Email{}) do
      %SentEmail{
        subject: bamboo_email.subject,
        to: Enum.map(bamboo_email.to, fn {_name, email} -> email end),
        html: bamboo_email.html_body,
        text: bamboo_email.text_body
      }
    end

    def as_string(email) do
      Enum.join([
        "- Subject: #{inspect(email.subject)}",
        "  To: #{Enum.join(email.to, ", ")}",
      ], "\n")
    end

    def matches?(email, %{subject: subject, to: to}) do
      email.subject == subject && Enum.any?(email.to, fn t -> t == to end)
    end
  end

  defmodule SentEmails do
    def new(emails) when is_list(emails) do
      emails |> Enum.map(fn email -> SentEmail.new(email) end)
    end

    def as_string(emails) when is_list(emails) do
      emails |> Enum.map(fn email -> SentEmail.as_string(email) end) |> Enum.join("\n")
    end

    def any?(emails, %{subject: subject, to: to}) when is_list(emails) do
      Enum.any?(emails, fn email -> SentEmail.matches?(email, %{subject: subject, to: to}) end)
    end
  end

end
