defmodule Operately.Support.Features.UI.DateField do
  alias Wallaby.Browser
  alias Operately.Support.Features.UI

  def select_day_in_date_field(ctx, testid: testid, date: date) do
    day_testid = "date-field-day-#{date.day}"

    ctx
    |> UI.click(testid: testid)
    |> UI.wait_until_has(css: "[data-testid='date-field-current-month']")
    |> UI.sleep(50)
    |> navigate_date_field_to_month(date)
    |> UI.sleep(50)
    |> UI.wait_until_has(testid: day_testid)
    |> UI.click(testid: day_testid)
    |> UI.sleep(50)
    |> UI.wait_until_has(css: "[data-test-id='#{day_testid}'][aria-pressed='true']")
    |> UI.wait_until_has(css: "[data-test-id='date-field-confirm']:not([disabled])")
    |> UI.sleep(50)
    |> UI.click(testid: "date-field-confirm")
    |> UI.sleep(100)
    |> UI.refute_has(testid: "date-field-confirm")
  end

  defp navigate_date_field_to_month(ctx, date) do
    {current_month, current_year} = read_date_field_displayed_month_year(ctx)
    month_offset = month_offset(current_month, current_year, date.month, date.year)

    case month_offset do
      0 ->
        ctx

      offset when offset > 0 ->
        navigate_by_months(ctx, "date-field-next-month", offset)
        |> wait_until_displayed_month(date.month, date.year)

      offset ->
        navigate_by_months(ctx, "date-field-prev-month", abs(offset))
        |> wait_until_displayed_month(date.month, date.year)
    end
  end

  defp navigate_by_months(ctx, button_testid, number_of_months) do
    selector = "[data-testid='#{button_testid}']"

    script = """
      const button = document.querySelector("#{selector}");

      for (let month = 0; month < #{number_of_months}; month++) {
        button.click();
      }
    """

    ctx
    |> UI.wait_until_has(css: selector)
    |> Map.update!(:session, &Browser.execute_script(&1, script))
  end

  defp wait_until_displayed_month(ctx, month, year) do
    case Browser.retry(fn ->
           if read_date_field_displayed_month_year(ctx) == {month, year} do
             {:ok, ctx}
           else
             {:error, :not_yet}
           end
         end) do
      {:ok, ctx} -> ctx
      {:error, _} -> raise "Timed out waiting for date field to show #{month}/#{year}"
    end
  end

  defp read_date_field_displayed_month_year(ctx) do
    script = """
      const el = document.querySelector('[data-testid="date-field-current-month"]');
      return el ? el.textContent.trim() : null;
    """

    Browser.execute_script(ctx[:session], script, fn result ->
      send(self(), {:date_field_current_month, result})
    end)

    text =
      receive do
        {:date_field_current_month, value} -> value
      end

    case parse_month_year(text) do
      {:ok, month, year} -> {month, year}
      :error -> raise "Could not read date field current month: #{inspect(text)}"
    end
  end

  defp parse_month_year(text) when is_binary(text) do
    case String.split(text, " ", trim: true) do
      [month_name, year_str] ->
        with {:ok, month} <- month_name_to_number(month_name),
             {year, ""} <- Integer.parse(year_str) do
          {:ok, month, year}
        else
          _ -> :error
        end

      _ ->
        :error
    end
  end

  defp parse_month_year(_), do: :error

  defp month_offset(from_month, from_year, to_month, to_year) do
    (to_year - from_year) * 12 + to_month - from_month
  end

  defp month_name_to_number("January"), do: {:ok, 1}
  defp month_name_to_number("February"), do: {:ok, 2}
  defp month_name_to_number("March"), do: {:ok, 3}
  defp month_name_to_number("April"), do: {:ok, 4}
  defp month_name_to_number("May"), do: {:ok, 5}
  defp month_name_to_number("June"), do: {:ok, 6}
  defp month_name_to_number("July"), do: {:ok, 7}
  defp month_name_to_number("August"), do: {:ok, 8}
  defp month_name_to_number("September"), do: {:ok, 9}
  defp month_name_to_number("October"), do: {:ok, 10}
  defp month_name_to_number("November"), do: {:ok, 11}
  defp month_name_to_number("December"), do: {:ok, 12}
  defp month_name_to_number(_), do: :error
end
