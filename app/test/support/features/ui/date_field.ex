defmodule Operately.Support.Features.UI.DateField do
  alias Wallaby.Browser

  def select_day_in_date_field(ctx, testid: testid, date: date) do
    day_number = date.day

    ctx
    |> Operately.Support.Features.UI.click(testid: testid)
    |> then(fn ctx ->
      ctx
      |> navigate_date_field_to_month(date)
      |> Operately.Support.Features.UI.click(testid: "date-field-day-#{day_number}")
      |> Operately.Support.Features.UI.click(testid: "date-field-confirm")
    end)
  end

  defp navigate_date_field_to_month(ctx, date) do
    max_iterations = 24
    navigate_date_field_to_month_recursive(ctx, date.month, date.year, max_iterations)
  end

  defp navigate_date_field_to_month_recursive(ctx, _target_month, _target_year, 0), do: ctx

  defp navigate_date_field_to_month_recursive(ctx, target_month, target_year, iterations_left) do
    {current_month, current_year} = read_date_field_displayed_month_year(ctx)

    cond do
      current_month == target_month and current_year == target_year ->
        ctx

      current_year < target_year or (current_year == target_year and current_month < target_month) ->
        ctx
        |> Operately.Support.Features.UI.click(css: "[data-testid='date-field-next-month']")
        |> navigate_date_field_to_month_recursive(target_month, target_year, iterations_left - 1)

      true ->
        ctx
        |> Operately.Support.Features.UI.click(css: "[data-testid='date-field-prev-month']")
        |> navigate_date_field_to_month_recursive(target_month, target_year, iterations_left - 1)
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
      :error -> {Date.utc_today().month, Date.utc_today().year}
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
