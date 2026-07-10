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
    max_iterations = 24
    navigate_date_field_to_month_recursive(ctx, date.month, date.year, max_iterations)
  end

  defp navigate_date_field_to_month_recursive(_ctx, target_month, target_year, 0) do
    raise "Timed out navigating date field to #{target_month}/#{target_year}"
  end

  defp navigate_date_field_to_month_recursive(ctx, target_month, target_year, iterations_left) do
    {current_month, current_year} = read_date_field_displayed_month_year(ctx)

    cond do
      current_month == target_month and current_year == target_year ->
        ctx

      current_year < target_year or (current_year == target_year and current_month < target_month) ->
        {next_month, next_year} = next_month(current_month, current_year)

        ctx
        |> UI.wait_until_has(css: "[data-testid='date-field-next-month']")
        |> UI.click(css: "[data-testid='date-field-next-month']")
        |> UI.sleep(100)
        |> wait_until_displayed_month(next_month, next_year)
        |> navigate_date_field_to_month_recursive(target_month, target_year, iterations_left - 1)

      true ->
        {prev_month, prev_year} = previous_month(current_month, current_year)

        ctx
        |> UI.wait_until_has(css: "[data-testid='date-field-prev-month']")
        |> UI.click(css: "[data-testid='date-field-prev-month']")
        |> UI.sleep(100)
        |> wait_until_displayed_month(prev_month, prev_year)
        |> navigate_date_field_to_month_recursive(target_month, target_year, iterations_left - 1)
    end
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

  defp next_month(12, year), do: {1, year + 1}
  defp next_month(month, year), do: {month + 1, year}

  defp previous_month(1, year), do: {12, year - 1}
  defp previous_month(month, year), do: {month - 1, year}

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
