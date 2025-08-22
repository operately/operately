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
    # Swoosh Test adapter doesn't have a get_sent_emails() function
    # Instead, it sends emails as messages to the test process
    # We need to collect all these messages from the process mailbox
    
    # Get current process mailbox messages
    {:messages, messages} = Process.info(self(), :messages)
    
    # Extract emails from messages - Swoosh uses different patterns than Bamboo
    emails = messages
    |> Enum.reduce([], fn message, acc ->
         case message do
           # Swoosh typically sends messages in this format to the test process
           {:email, email} when is_struct(email, Swoosh.Email) ->
             [email | acc]
           # Some versions might use different message formats
           {_, :email, email} when is_struct(email, Swoosh.Email) ->
             [email | acc]
           # Direct email struct messages  
           email when is_struct(email, Swoosh.Email) ->
             [email | acc]
           _ ->
             acc
         end
       end)
    |> Enum.reverse()
    
    emails |> SentEmails.new()
  end

  def last_sent_email() do
    list_sent_emails() |> List.last()
  end

  def last_sent_email(to: email) do
    list_sent_emails() |> Enum.filter(fn s -> email in s.to end) |> List.last()
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

  def wait_for_email_for(email, attempts: attempts) do
    emails = list_sent_emails()
    emails = Enum.filter(emails, fn s -> email in s.to end)

    case emails do
      [] -> 
        if attempts == 0 do
          raise "#{email} did not receive an email"
        else
          :timer.sleep(1000)
          wait_for_email_for(email, attempts: attempts - 1)
        end

      _ -> emails
    end
  end

  defmodule SentEmail do
    defstruct subject: nil, to: nil, html: nil, text: nil

    def new(swoosh_email = %Swoosh.Email{}) do
      %SentEmail{
        subject: swoosh_email.subject,
        to: extract_addresses(swoosh_email.to),
        html: swoosh_email.html_body,
        text: swoosh_email.text_body
      }
    end

    defp extract_addresses(to) when is_list(to) do
      Enum.map(to, fn
        %{address: address} -> address
        {_name, address} -> address
        address when is_binary(address) -> address
      end)
    end
    defp extract_addresses(to) when is_binary(to), do: [to]
    defp extract_addresses(%{address: address}), do: [address]
    defp extract_addresses({_name, address}), do: [address]

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
