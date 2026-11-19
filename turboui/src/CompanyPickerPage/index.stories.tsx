import type { Meta, StoryObj } from "@storybook/react-vite";
import { CompanyPickerPage } from ".";

const meta = {
  title: "Pages/CompanyPickerPage",
  component: CompanyPickerPage,
  parameters: { layout: "fullscreen" },
  args: {
    companies: [
      { id: "acme", name: "Acme" },
      { id: "orbit", name: "Orbit" },
    ],
    description: "Launch a product",
    companyPath: (id) => `/${id}/templates/launch/use`,
  },
} satisfies Meta<typeof CompanyPickerPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongCompanyName: Story = {
  args: { companies: [{ id: "acme", name: "Acme International Research and Development Corporation" }] },
};
