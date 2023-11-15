defmodule Mix.Tasks.Operately.Gen.Page do
  import Mix.Operately, only: [generate_file: 2]

  def run([name]) do
    check_name(name)
    page_name = Macro.camelize(name)

    File.mkdir_p("assets/js/pages/#{page_name}")

    generate_loader(page_name)
    generate_page(page_name)
    generate_index(page_name)
  end

  def generate_index(page_name) do
    generate_file("assets/js/pages/#{page_name}/index.tsx", fn _path ->
      """
      export { loader } from "./loader";
      export { Page } from "./page";
      """
    end)
  end

  def generate_loader(page_name) do
    generate_file("assets/js/pages/#{page_name}/loader.tsx", fn _path ->
      """
      import * as Pages from "@/components/Pages";

      export interface LoaderResult {
      }

      export async function loader({params}) : Promise<LoaderResult> {
        // TODO: Implement

        return {}
      }

      export function useLoadedData() : LoaderResult {
        return Pages.useLoadedData() as LoaderResult;
      }

      export function useRefresh() {
        return Pages.useRefresh();
      }
      """
    end)
  end

  def generate_page(page_name) do
    generate_file("assets/js/pages/#{page_name}/page.tsx", fn _path ->
      """
      import * as React from "react";
      import * as Paper from "@/components/PaperContainer";
      import * as Pages from "@/components/Pages";

      import { useLoadedData } from "./loader";
      
      export function Page() {
        const data = useLoadedData();

        return (
          <Pages.Page title={"#{page_name}"}>
            <Paper.Root>
              <Paper.Body>
                <div className="text-white-1 text-3xl font-extrabold">#{page_name}</div>
              </Paper.Body>
            </Paper.Root>
          </Pages.Page>
        );
      }
      """
    end)
  end

  defp check_name(name) do
    if String.contains?(name, "-") do
      raise """
      Page name should be camel case. Example: ProfilePage
      """
    end

    if String.contains?(name, "_") do
      raise """
      Page name should be camel case. Example: ProfilePage
      """
    end

    unless String.ends_with?(name, "Page") do
      raise """
      Page name should end with 'Page'. Example: ProfilePage
      """
    end
  end

end
